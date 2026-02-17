import { createRealtimeEventStream } from "../transport/realtimeEventStream.js";
import type {
	RealtimeEventSourceLike,
	RealtimeEventStream,
	RealtimeEventStreamOptions,
	RealtimeTransportKind,
	RealtimeWebSocketLike
} from "../transport/realtimeEventStream.js";
import type { PhoenixRequestOptions } from "../transport/types.js";
import type {
	DeltaUpdateRequest,
	RealtimeNegotiateResponse,
	RealtimeServerEvent,
	SessionStartAcceptedResponse,
	SessionStartSnapshotRequest,
	TaskStatusResponse
} from "../validators/schemas.js";
import { EngineSessionSyncAdapter } from "./EngineSessionSyncAdapter.js";
import type {
	EngineSessionResyncContext,
	EngineSessionSyncClient,
	SendDeltaWithRecoveryResult
} from "./EngineSessionSyncAdapter.js";
import type { WaitForTaskReadyOptions } from "./types.js";

export interface EngineFrontendRuntimeClient extends EngineSessionSyncClient {
	realtimeNegotiate(
		request: {
			schema_version: "v1";
			session_id: string;
			user_id: string;
		},
		options?: PhoenixRequestOptions
	): Promise<RealtimeNegotiateResponse>;

	waitForTaskReady(planId: string, options?: WaitForTaskReadyOptions): Promise<TaskStatusResponse>;
}

export interface EngineRealtimeConnectOptions {
	readonly transport?: RealtimeTransportKind;
	readonly signal?: AbortSignal;
	readonly webSocketFactory?: (url: string) => RealtimeWebSocketLike;
	readonly eventSourceFactory?: (url: string) => RealtimeEventSourceLike;
	readonly negotiateRequestOptions?: PhoenixRequestOptions;
}

export interface EngineFrontendRuntimeOptions {
	readonly client: EngineFrontendRuntimeClient;
	readonly sessionId: string;
	readonly userId: string;
	readonly snapshotProvider: () => SessionStartSnapshotRequest | Promise<SessionStartSnapshotRequest>;
	readonly onResync?: (context: EngineSessionResyncContext) => void | Promise<void>;
	readonly sessionStartRequestOptions?: PhoenixRequestOptions;
	readonly deltaRequestOptions?: PhoenixRequestOptions;
	readonly connectRealtimeOptions?: EngineRealtimeConnectOptions;
}

export type EngineRealtimeEventHandler = (event: RealtimeServerEvent) => void | Promise<void>;

export class EngineFrontendRuntime {
	private readonly client: EngineFrontendRuntimeClient;
	private readonly sessionSyncAdapter: EngineSessionSyncAdapter;
	private readonly sessionId: string;
	private readonly userId: string;
	private readonly defaultConnectRealtimeOptions?: EngineRealtimeConnectOptions;
	private realtimeEvents: RealtimeEventStream | null = null;
	private realtimeNegotiation: RealtimeNegotiateResponse | null = null;

	public constructor(options: EngineFrontendRuntimeOptions) {
		this.client = options.client;
		this.sessionId = options.sessionId;
		this.userId = options.userId;
		this.defaultConnectRealtimeOptions = options.connectRealtimeOptions;
		this.sessionSyncAdapter = new EngineSessionSyncAdapter({
			client: options.client,
			sessionId: options.sessionId,
			snapshotProvider: options.snapshotProvider,
			onResync: options.onResync,
			sessionStartRequestOptions: options.sessionStartRequestOptions,
			deltaRequestOptions: options.deltaRequestOptions
		});
	}

	public async startSession(options?: PhoenixRequestOptions): Promise<SessionStartAcceptedResponse> {
		return this.sessionSyncAdapter.startSession(options);
	}

	public async connectRealtime(options?: EngineRealtimeConnectOptions): Promise<RealtimeNegotiateResponse> {
		const connectOptions = options ?? this.defaultConnectRealtimeOptions;
		const negotiation = await this.client.realtimeNegotiate(
			{
				schema_version: "v1",
				session_id: this.sessionId,
				user_id: this.userId
			},
			connectOptions?.negotiateRequestOptions
		);

		this.disconnectRealtime();

		this.realtimeEvents = createRealtimeEventStream({
			url: negotiation.url,
			accessToken: negotiation.access_token,
			transport: connectOptions?.transport,
			signal: connectOptions?.signal,
			webSocketFactory: connectOptions?.webSocketFactory,
			eventSourceFactory: connectOptions?.eventSourceFactory
		});
		this.realtimeNegotiation = negotiation;

		return negotiation;
	}

	public getRealtimeEvents(): RealtimeEventStream | null {
		return this.realtimeEvents;
	}

	public getRealtimeNegotiation(): RealtimeNegotiateResponse | null {
		return this.realtimeNegotiation;
	}

	public async waitForTaskReady(planId: string, options?: WaitForTaskReadyOptions): Promise<TaskStatusResponse> {
		return this.client.waitForTaskReady(planId, {
			...(options ?? {}),
			realtimeEvents: options?.realtimeEvents ?? this.realtimeEvents ?? undefined
		});
	}

	public async sendDeltaWithRecovery(
		deltaRequest: DeltaUpdateRequest,
		options?: PhoenixRequestOptions
	): Promise<SendDeltaWithRecoveryResult> {
		return this.sessionSyncAdapter.sendDeltaWithRecovery(deltaRequest, options);
	}

	public async handleRealtimeEvent(event: RealtimeServerEvent): Promise<boolean> {
		return this.sessionSyncAdapter.handleRealtimeEvent(event);
	}

	public async consumeRealtimeEvents(signal?: AbortSignal): Promise<void> {
		if (!this.realtimeEvents) {
			return;
		}

		await this.sessionSyncAdapter.consumeRealtimeEvents(this.realtimeEvents, signal);
	}

	public async runRealtimeLoop(handler: EngineRealtimeEventHandler, signal?: AbortSignal): Promise<void> {
		if (!this.realtimeEvents) {
			return;
		}

		for await (const event of this.realtimeEvents) {
			if (signal?.aborted) {
				return;
			}

			await this.sessionSyncAdapter.handleRealtimeEvent(event);
			await handler(event);
		}
	}

	public disconnectRealtime(): void {
		this.realtimeEvents?.close();
		this.realtimeEvents = null;
		this.realtimeNegotiation = null;
	}
}

export const createEngineFrontendRuntime = (options: EngineFrontendRuntimeOptions): EngineFrontendRuntime =>
	new EngineFrontendRuntime(options);

export type EngineRealtimeEventStreamOptions = Omit<
	RealtimeEventStreamOptions,
	"url" | "accessToken" | "transport" | "signal" | "webSocketFactory" | "eventSourceFactory"
>;