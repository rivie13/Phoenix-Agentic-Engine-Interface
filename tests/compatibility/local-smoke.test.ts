import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PhoenixClient } from "../../sdk/client/PhoenixClient.js";
import type {
  DeltaUpdateRequest,
  RealtimeNegotiateRequest,
  SessionStartSnapshotRequest,
  TaskRequest
} from "../../sdk/validators/schemas.js";

const runSmoke = process.env.PHOENIX_RUN_SMOKE === "1";
const maybeDescribe = runSmoke ? describe : describe.skip;
const fixtureRoot = fileURLToPath(new URL("../../contracts/v1", import.meta.url));

const load = <T>(file: string): T => JSON.parse(readFileSync(join(fixtureRoot, file), "utf8")) as T;

const nowIso = (): string => new Date().toISOString();
const uniqueSuffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

maybeDescribe("Gateway smoke (optional)", () => {
  it("validates v1 control-plane flow against configured gateway", async () => {
    const baseUrl =
      process.env.PHOENIX_TEST_BASE_URL?.trim() ??
      process.env.PHOENIX_PUBLIC_GATEWAY_URL?.trim() ??
      "";
    if (!baseUrl) {
      throw new Error(
        "PHOENIX_PUBLIC_GATEWAY_URL is required for smoke tests. Set it to your Azure App Service gateway URL."
      );
    }
    const timeoutCandidate = Number(process.env.PHOENIX_SMOKE_TIMEOUT_MS ?? "10000");
    const timeoutMs = Number.isFinite(timeoutCandidate) && timeoutCandidate > 0 ? timeoutCandidate : 10000;
    const userId = process.env.PHOENIX_TEST_USER_ID ?? "smoke-user";
    const suffix = uniqueSuffix();
    const sessionId = `sess-smoke-${suffix}`;
    const taskId = `task-smoke-${suffix}`;

    const sessionStartFixture = load<SessionStartSnapshotRequest>("session_start.request.json");
    const deltaFixture = load<DeltaUpdateRequest>("delta_update.request.json");
    const taskFixture = load<TaskRequest>("task_request.request.json");
    const negotiateFixture = load<RealtimeNegotiateRequest>("gateway/realtime_negotiate.request.json");

    const sessionStartRequest: SessionStartSnapshotRequest = {
      ...sessionStartFixture,
      session_id: sessionId,
      idempotency_key: `idem-start-${suffix}`,
      sent_at: nowIso()
    };

    const deltaRequest: DeltaUpdateRequest = {
      ...deltaFixture,
      session_id: sessionId,
      idempotency_key: `idem-delta-${suffix}`,
      sent_at: nowIso(),
      sequence: 1
    };

    const taskRequest: TaskRequest = {
      ...taskFixture,
      session_id: sessionId,
      task_id: taskId,
      submitted_at: nowIso()
    };

    const negotiateRequest: RealtimeNegotiateRequest = {
      ...negotiateFixture,
      session_id: sessionId,
      user_id: userId
    };

    const client = PhoenixClient.fromConfig({
      baseUrl,
      tokenProvider: process.env.PHOENIX_TEST_TOKEN ?? "local-dev-token",
      authMode: process.env.PHOENIX_AUTH_MODE,
      retry: {
        maxRetries: 2,
        timeoutMs,
        baseDelayMs: 100,
        maxDelayMs: 500
      }
    });

    const handshake = await client.authHandshake();
    const list = await client.toolsList();
    const sessionStart = await client.sessionStart(sessionStartRequest);
    const delta = await client.sessionDelta(deltaRequest);
    const taskAccepted = await client.taskRequest(taskRequest);
    const taskStatus = await client.taskStatus(taskAccepted.plan_id);
    const negotiate = await client.realtimeNegotiate(negotiateRequest);
    const locks = await client.locksList();

    expect(handshake.schema_version).toBe("v1");
    expect(handshake.event).toBe("auth_handshake_ack");

    expect(list.schema_version).toBe("v1");
    expect(list.event).toBe("tool_list");
    expect(Array.isArray(list.tools)).toBe(true);

    expect(sessionStart.schema_version).toBe("v1");
    expect(sessionStart.event).toBe("session_start_ack");
    expect(sessionStart.session_id).toBe(sessionId);

    expect(delta.schema_version).toBe("v1");
    expect(delta.event).toBe("scene_changed_ack");
    expect(delta.session_id).toBe(sessionId);
    expect(delta.sequence).toBe(1);

    expect(taskAccepted.schema_version).toBe("v1");
    expect(taskAccepted.event).toBe("task_queued_ack");
    expect(taskAccepted.accepted).toBe(true);
    expect(taskAccepted.session_id).toBe(sessionId);
    expect(taskAccepted.task_id).toBe(taskId);
    expect(taskAccepted.plan_id.length).toBeGreaterThan(0);

    expect(taskStatus.schema_version).toBe("v1");
    expect(taskStatus.plan_id).toBe(taskAccepted.plan_id);
    expect(taskStatus.session_id).toBe(sessionId);

    expect(negotiate.schema_version).toBe("v1");
    expect(negotiate.event).toBe("realtime_negotiate_ack");
    expect(negotiate.session_id).toBe(sessionId);
    expect(negotiate.url.length).toBeGreaterThan(0);
    expect(Array.isArray(negotiate.groups)).toBe(true);

    expect(locks.schema_version).toBe("v1");
    expect(Array.isArray(locks.locks)).toBe(true);

    const sessionLock = locks.locks.find(lock => lock.session_id === sessionId);
    if (sessionLock) {
      const release = await client.lockRelease(sessionLock.lock_id);
      expect(release.schema_version).toBe("v1");
      expect(release.event).toBe("lock_released");
      expect(release.released).toBe(true);
    }
  }, 30000);
});
