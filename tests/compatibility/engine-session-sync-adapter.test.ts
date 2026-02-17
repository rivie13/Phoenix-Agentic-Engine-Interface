import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { EngineSessionSyncAdapter } from "../../sdk/client/EngineSessionSyncAdapter.js";
import { PhoenixSdkError } from "../../sdk/transport/errors.js";
import type {
	DeltaUpdateAcceptedResponse,
	DeltaUpdateRequest,
	RealtimeServerEvent,
	SessionStartAcceptedResponse,
	SessionStartSnapshotRequest
} from "../../sdk/validators/schemas.js";

type SessionResyncRequiredEvent = Extract<RealtimeServerEvent, { event: "session.resync_required" }>;

const fixtureRoot = fileURLToPath(new URL("../../contracts/v1", import.meta.url));

const load = <T>(file: string): T => JSON.parse(readFileSync(join(fixtureRoot, file), "utf8")) as T;

describe("EngineSessionSyncAdapter", () => {
	it("sends delta normally when no conflict occurs", async () => {
		const fixtures = {
			snapshot: load<SessionStartSnapshotRequest>("session_start.request.json"),
			deltaRequest: load<DeltaUpdateRequest>("delta_update.request.json"),
			deltaAck: load<DeltaUpdateAcceptedResponse>("delta_update.response.json"),
			sessionAck: load<SessionStartAcceptedResponse>("session_start.response.json")
		};

		const sessionStart = vi.fn(async () => fixtures.sessionAck);
		const sessionDelta = vi.fn(async () => fixtures.deltaAck);

		const adapter = new EngineSessionSyncAdapter({
			client: {
				sessionStart,
				sessionDelta
			},
			sessionId: "sess-001",
			snapshotProvider: () => fixtures.snapshot
		});

		const result = await adapter.sendDeltaWithRecovery(fixtures.deltaRequest);

		expect(result.recoveredByResync).toBe(false);
		expect(result.ack).toEqual(fixtures.deltaAck);
		expect(sessionDelta).toHaveBeenCalledTimes(1);
		expect(sessionStart).toHaveBeenCalledTimes(0);
	});

	it("recovers from HTTP 409 by triggering snapshot resync", async () => {
		const fixtures = {
			snapshot: load<SessionStartSnapshotRequest>("session_start.request.json"),
			deltaRequest: load<DeltaUpdateRequest>("delta_update.request.json"),
			sessionAck: load<SessionStartAcceptedResponse>("session_start.response.json")
		};

		const conflict = new PhoenixSdkError({
			kind: "http",
			status: 409,
			message: "session transition conflict",
			retriable: false
		});

		const sessionStart = vi.fn(async () => fixtures.sessionAck);
		const sessionDelta = vi.fn(async () => {
			throw conflict;
		});
		const onResync = vi.fn(async () => undefined);

		const adapter = new EngineSessionSyncAdapter({
			client: {
				sessionStart,
				sessionDelta
			},
			sessionId: "sess-001",
			snapshotProvider: () => fixtures.snapshot,
			onResync
		});

		const result = await adapter.sendDeltaWithRecovery(fixtures.deltaRequest);

		expect(result).toEqual({ recoveredByResync: true });
		expect(sessionDelta).toHaveBeenCalledTimes(1);
		expect(sessionStart).toHaveBeenCalledTimes(1);
		expect(onResync).toHaveBeenCalledWith(
			expect.objectContaining({
				source: "http_409_conflict",
				reason: "http_409_conflict"
			})
		);
	});

	it("handles session.resync_required realtime event for matching session", async () => {
		const fixtures = {
			snapshot: load<SessionStartSnapshotRequest>("session_start.request.json"),
			sessionAck: load<SessionStartAcceptedResponse>("session_start.response.json"),
			resyncEvent: load<SessionResyncRequiredEvent>("realtime/session_resync_required.json")
		};

		const sessionStart = vi.fn(async () => fixtures.sessionAck);
		const sessionDelta = vi.fn(async () => {
			throw new Error("not expected");
		});

		const adapter = new EngineSessionSyncAdapter({
			client: {
				sessionStart,
				sessionDelta
			},
			sessionId: "sess-001",
			snapshotProvider: () => fixtures.snapshot
		});

		const handled = await adapter.handleRealtimeEvent(fixtures.resyncEvent);
		expect(handled).toBe(true);
		expect(sessionStart).toHaveBeenCalledTimes(1);

		const ignored = await adapter.handleRealtimeEvent({
			...fixtures.resyncEvent,
			session_id: "sess-other"
		});
		expect(ignored).toBe(false);
		expect(sessionStart).toHaveBeenCalledTimes(1);
	});
});