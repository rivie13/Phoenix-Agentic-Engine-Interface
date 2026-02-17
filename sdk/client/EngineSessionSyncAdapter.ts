import { PhoenixSdkError } from "../transport/errors.js";
import type { PhoenixRequestOptions } from "../transport/types.js";
import type {
	DeltaUpdateAcceptedResponse,
	DeltaUpdateRequest,
	RealtimeServerEvent,
	SessionStartAcceptedResponse,
	SessionStartSnapshotRequest
} from "../validators/schemas.js";

export interface EngineSessionSyncClient {
	sessionStart(
		request: SessionStartSnapshotRequest,
		options?: PhoenixRequestOptions
	): Promise<SessionStartAcceptedResponse>;

	sessionDelta(request: DeltaUpdateRequest, options?: PhoenixRequestOptions): Promise<DeltaUpdateAcceptedResponse>;
}

export type EngineSessionResyncSource = "http_409_conflict" | "realtime_resync_required";

export interface EngineSessionResyncContext {
	readonly source: EngineSessionResyncSource;
	readonly reason: string;
	readonly lastConfirmedSequence?: number;
	readonly triggerEvent?: RealtimeServerEvent;
	readonly triggerError?: PhoenixSdkError;
}

export interface SendDeltaWithRecoveryResult {
	readonly recoveredByResync: boolean;
	readonly ack?: DeltaUpdateAcceptedResponse;
}

export interface EngineSessionSyncAdapterOptions {
	readonly client: EngineSessionSyncClient;
	readonly sessionId: string;
	readonly snapshotProvider: () => SessionStartSnapshotRequest | Promise<SessionStartSnapshotRequest>;
	readonly onResync?: (context: EngineSessionResyncContext) => void | Promise<void>;
	readonly sessionStartRequestOptions?: PhoenixRequestOptions;
	readonly deltaRequestOptions?: PhoenixRequestOptions;
}

const mergeRequestOptions = (
	base: PhoenixRequestOptions | undefined,
	override: PhoenixRequestOptions | undefined
): PhoenixRequestOptions | undefined => {
	if (!base) {
		return override;
	}

	if (!override) {
		return base;
	}

	return {
		...base,
		...override,
		headers: {
			...(base.headers ?? {}),
			...(override.headers ?? {})
		},
		correlationHeaders: {
			...(base.correlationHeaders ?? {}),
			...(override.correlationHeaders ?? {})
		}
	};
};

const isConflictError = (error: unknown): error is PhoenixSdkError =>
	error instanceof PhoenixSdkError && error.kind === "http" && error.status === 409;

export class EngineSessionSyncAdapter {
	private readonly client: EngineSessionSyncClient;
	private readonly sessionId: string;
	private readonly snapshotProvider: () => SessionStartSnapshotRequest | Promise<SessionStartSnapshotRequest>;
	private readonly onResync?: (context: EngineSessionResyncContext) => void | Promise<void>;
	private readonly sessionStartRequestOptions?: PhoenixRequestOptions;
	private readonly deltaRequestOptions?: PhoenixRequestOptions;
	private resyncInFlight: Promise<SessionStartAcceptedResponse> | null = null;

	public constructor(options: EngineSessionSyncAdapterOptions) {
		this.client = options.client;
		this.sessionId = options.sessionId;
		this.snapshotProvider = options.snapshotProvider;
		this.onResync = options.onResync;
		this.sessionStartRequestOptions = options.sessionStartRequestOptions;
		this.deltaRequestOptions = options.deltaRequestOptions;
	}

	public async startSession(options?: PhoenixRequestOptions): Promise<SessionStartAcceptedResponse> {
		const snapshot = await this.snapshotProvider();
		this.assertSession(snapshot.session_id, "session snapshot");
		return this.client.sessionStart(snapshot, mergeRequestOptions(this.sessionStartRequestOptions, options));
	}

	public async sendDeltaWithRecovery(
		deltaRequest: DeltaUpdateRequest,
		options?: PhoenixRequestOptions
	): Promise<SendDeltaWithRecoveryResult> {
		this.assertSession(deltaRequest.session_id, "delta update");

		try {
			const ack = await this.client.sessionDelta(deltaRequest, mergeRequestOptions(this.deltaRequestOptions, options));
			return {
				recoveredByResync: false,
				ack
			};
		} catch (error) {
			if (!isConflictError(error)) {
				throw error;
			}

			await this.performResync({
				source: "http_409_conflict",
				reason: "http_409_conflict",
				triggerError: error
			});

			return {
				recoveredByResync: true
			};
		}
	}

	public async handleRealtimeEvent(event: RealtimeServerEvent): Promise<boolean> {
		if (event.event !== "session.resync_required") {
			return false;
		}

		if (event.session_id !== this.sessionId) {
			return false;
		}

		await this.performResync({
			source: "realtime_resync_required",
			reason: event.reason,
			lastConfirmedSequence: event.last_confirmed_seq,
			triggerEvent: event
		});

		return true;
	}

	public async consumeRealtimeEvents(
		events: AsyncIterable<RealtimeServerEvent>,
		signal?: AbortSignal
	): Promise<void> {
		for await (const event of events) {
			if (signal?.aborted) {
				return;
			}

			await this.handleRealtimeEvent(event);
		}
	}

	private async performResync(context: EngineSessionResyncContext): Promise<SessionStartAcceptedResponse> {
		if (this.resyncInFlight) {
			return this.resyncInFlight;
		}

		this.resyncInFlight = (async () => {
			await this.onResync?.(context);

			const snapshot = await this.snapshotProvider();
			this.assertSession(snapshot.session_id, "session snapshot");

			return this.client.sessionStart(snapshot, this.sessionStartRequestOptions);
		})();

		try {
			return await this.resyncInFlight;
		} finally {
			this.resyncInFlight = null;
		}
	}

	private assertSession(sessionId: string, context: string): void {
		if (sessionId === this.sessionId) {
			return;
		}

		throw new PhoenixSdkError({
			kind: "validation",
			message: `${context} session_id '${sessionId}' does not match adapter session_id '${this.sessionId}'`,
			retriable: false,
			details: {
				context,
				expectedSessionId: this.sessionId,
				actualSessionId: sessionId
			}
		});
	}
}