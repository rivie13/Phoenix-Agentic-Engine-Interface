import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { EngineFrontendRuntime } from "../../sdk/client/EngineFrontendRuntime.js";
import { PhoenixSdkError } from "../../sdk/transport/errors.js";
import type {
  DeltaUpdateRequest,
  RealtimeNegotiateResponse,
  RealtimeServerEvent,
  SessionStartAcceptedResponse,
  SessionStartSnapshotRequest,
  TaskStatusResponse
} from "../../sdk/validators/schemas.js";

const fixtureRoot = fileURLToPath(new URL("../../contracts/v1", import.meta.url));

const load = <T>(file: string): T => JSON.parse(readFileSync(join(fixtureRoot, file), "utf8")) as T;

type SessionResyncRequiredEvent = Extract<RealtimeServerEvent, { event: "session.resync_required" }>;

class FakeRealtimeSocket {
  private readonly listeners = new Map<string, Set<(event: unknown) => void>>();

  public addEventListener(type: string, listener: (event: unknown) => void): void {
    const handlers = this.listeners.get(type) ?? new Set<(event: unknown) => void>();
    handlers.add(listener);
    this.listeners.set(type, handlers);
  }

  public removeEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  public close(): void {
    this.emit("close", { code: 1000 });
  }

  public emit(type: string, event: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe("EngineFrontendRuntime", () => {
  it("connects realtime and forwards stream into waitForTaskReady", async () => {
    const fixtures = {
      snapshot: load<SessionStartSnapshotRequest>("session_start.request.json"),
      sessionAck: load<SessionStartAcceptedResponse>("session_start.response.json"),
      negotiateResponse: load<RealtimeNegotiateResponse>("gateway/realtime_negotiate.response.json"),
      taskStatus: load<TaskStatusResponse>("gateway/task_status.response.json"),
      planReady: load<RealtimeServerEvent>("realtime/plan_ready.json")
    };

    const socket = new FakeRealtimeSocket();
    const realtimeNegotiate = vi.fn(async () => fixtures.negotiateResponse);
    const waitForTaskReady = vi.fn(async (_planId: string, options?: { realtimeEvents?: AsyncIterable<RealtimeServerEvent> }) => {
      const iterator = options?.realtimeEvents?.[Symbol.asyncIterator]();
      const next = await iterator?.next();
      expect(next?.value).toMatchObject({ event: "plan.ready" });
      return fixtures.taskStatus;
    });

    const runtime = new EngineFrontendRuntime({
      client: {
        sessionStart: vi.fn(async () => fixtures.sessionAck),
        sessionDelta: vi.fn(async () => {
          throw new Error("not expected");
        }),
        realtimeNegotiate,
        waitForTaskReady
      },
      sessionId: "sess-001",
      userId: "user-001",
      snapshotProvider: () => fixtures.snapshot
    });

    await runtime.connectRealtime({
      transport: "websocket",
      webSocketFactory: () => socket
    });

    const waitPromise = runtime.waitForTaskReady("plan-001", {
      timeoutMs: 1000,
      realtimeWaitMs: 200,
      pollIntervalMs: 10
    });

    setTimeout(() => {
      socket.emit("message", { data: JSON.stringify(fixtures.planReady) });
    }, 0);

    const status = await waitPromise;
    expect(status).toEqual(fixtures.taskStatus);
    expect(realtimeNegotiate).toHaveBeenCalledWith(
      {
        schema_version: "v1",
        session_id: "sess-001",
        user_id: "user-001"
      },
      undefined
    );
    expect(waitForTaskReady).toHaveBeenCalledTimes(1);

    runtime.disconnectRealtime();
  });

  it("recovers delta conflict via composed session sync adapter", async () => {
    const fixtures = {
      snapshot: load<SessionStartSnapshotRequest>("session_start.request.json"),
      sessionAck: load<SessionStartAcceptedResponse>("session_start.response.json"),
      deltaRequest: load<DeltaUpdateRequest>("delta_update.request.json"),
      negotiateResponse: load<RealtimeNegotiateResponse>("gateway/realtime_negotiate.response.json"),
      taskStatus: load<TaskStatusResponse>("gateway/task_status.response.json")
    };

    const sessionStart = vi.fn(async () => fixtures.sessionAck);
    const sessionDelta = vi.fn(async () => {
      throw new PhoenixSdkError({
        kind: "http",
        status: 409,
        message: "conflict",
        retriable: false
      });
    });

    const runtime = new EngineFrontendRuntime({
      client: {
        sessionStart,
        sessionDelta,
        realtimeNegotiate: vi.fn(async () => fixtures.negotiateResponse),
        waitForTaskReady: vi.fn(async () => fixtures.taskStatus)
      },
      sessionId: "sess-001",
      userId: "user-001",
      snapshotProvider: () => fixtures.snapshot
    });

    const result = await runtime.sendDeltaWithRecovery(fixtures.deltaRequest);
    expect(result).toEqual({ recoveredByResync: true });
    expect(sessionDelta).toHaveBeenCalledTimes(1);
    expect(sessionStart).toHaveBeenCalledTimes(1);
  });

  it("handles realtime session.resync_required through composed session sync adapter", async () => {
    const fixtures = {
      snapshot: load<SessionStartSnapshotRequest>("session_start.request.json"),
      sessionAck: load<SessionStartAcceptedResponse>("session_start.response.json"),
      resyncEvent: load<SessionResyncRequiredEvent>("realtime/session_resync_required.json"),
      negotiateResponse: load<RealtimeNegotiateResponse>("gateway/realtime_negotiate.response.json"),
      taskStatus: load<TaskStatusResponse>("gateway/task_status.response.json")
    };

    const sessionStart = vi.fn(async () => fixtures.sessionAck);

    const runtime = new EngineFrontendRuntime({
      client: {
        sessionStart,
        sessionDelta: vi.fn(async () => {
          throw new Error("not expected");
        }),
        realtimeNegotiate: vi.fn(async () => fixtures.negotiateResponse),
        waitForTaskReady: vi.fn(async () => fixtures.taskStatus)
      },
      sessionId: "sess-001",
      userId: "user-001",
      snapshotProvider: () => fixtures.snapshot
    });

    const handled = await runtime.handleRealtimeEvent(fixtures.resyncEvent);
    expect(handled).toBe(true);
    expect(sessionStart).toHaveBeenCalledTimes(1);
  });

  it("runs unified realtime loop with callback and resync handling", async () => {
    const fixtures = {
      snapshot: load<SessionStartSnapshotRequest>("session_start.request.json"),
      sessionAck: load<SessionStartAcceptedResponse>("session_start.response.json"),
      negotiateResponse: load<RealtimeNegotiateResponse>("gateway/realtime_negotiate.response.json"),
      resyncEvent: load<SessionResyncRequiredEvent>("realtime/session_resync_required.json")
    };

    const socket = new FakeRealtimeSocket();
    const sessionStart = vi.fn(async () => fixtures.sessionAck);
    const callback = vi.fn(async () => undefined);

    const runtime = new EngineFrontendRuntime({
      client: {
        sessionStart,
        sessionDelta: vi.fn(async () => {
          throw new Error("not expected");
        }),
        realtimeNegotiate: vi.fn(async () => fixtures.negotiateResponse),
        waitForTaskReady: vi.fn(async () => {
          throw new Error("not expected");
        })
      },
      sessionId: "sess-001",
      userId: "user-001",
      snapshotProvider: () => fixtures.snapshot
    });

    await runtime.connectRealtime({
      transport: "websocket",
      webSocketFactory: () => socket
    });

    const loopPromise = runtime.runRealtimeLoop(callback);

    socket.emit("message", { data: JSON.stringify(fixtures.resyncEvent) });
    socket.close();

    await loopPromise;

    expect(sessionStart).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(fixtures.resyncEvent);
  });
});