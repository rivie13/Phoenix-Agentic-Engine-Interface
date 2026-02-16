import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { PhoenixClient } from "../../sdk/client/PhoenixClient.js";
import type {
  ApprovalDecisionRequest,
  AuthHandshakeResponse,
  CommandResponse,
  DeltaUpdateAcceptedResponse,
  DeltaUpdateRequest,
  LockReleaseResponse,
  LocksListResponse,
  RealtimeNegotiateRequest,
  RealtimeNegotiateResponse,
  RealtimeServerEvent,
  TaskRequestAcceptedResponse,
  SessionStartAcceptedResponse,
  SessionStartSnapshotRequest,
  TaskRequest,
  TaskStatusResponse,
  ToolInvokeRequest,
  ToolInvokeResponse,
  ToolListResponse
} from "../../sdk/validators/schemas.js";

const fixtureRoot = fileURLToPath(new URL("../../contracts/v1", import.meta.url));

const load = <T>(file: string): T => JSON.parse(readFileSync(join(fixtureRoot, file), "utf8")) as T;

describe("SDK compatibility against fixture mirror", () => {
  it("parses all endpoint responses using mirrored fixtures", async () => {
    const fixtures = {
      sessionStartRequest: load<SessionStartSnapshotRequest>("session_start.request.json"),
      sessionStartResponse: load<SessionStartAcceptedResponse>("session_start.response.json"),
      deltaRequest: load<DeltaUpdateRequest>("delta_update.request.json"),
      deltaResponse: load<DeltaUpdateAcceptedResponse>("delta_update.response.json"),
      taskRequest: load<TaskRequest>("task_request.request.json"),
      taskResponse: load<TaskRequestAcceptedResponse>("task_request.response.json"),
      approvalRequest: load<ApprovalDecisionRequest>("approval_decision.request.json"),
      approvalResponse: load<CommandResponse>("approval_decision.response.json"),
      handshakeResponse: load<AuthHandshakeResponse>("auth_handshake.response.json"),
      toolsListResponse: load<ToolListResponse>("tools_list.response.json"),
      toolsInvokeRequest: load<ToolInvokeRequest>("tools_invoke.request.json"),
      toolsInvokeResponse: load<ToolInvokeResponse>("tools_invoke.response.json"),
      realtimeNegotiateRequest: load<RealtimeNegotiateRequest>("gateway/realtime_negotiate.request.json"),
      realtimeNegotiateResponse: load<RealtimeNegotiateResponse>("gateway/realtime_negotiate.response.json"),
      taskStatusResponse: load<TaskStatusResponse>("gateway/task_status.response.json"),
      locksListResponse: load<LocksListResponse>("gateway/locks_list.response.json"),
      lockReleaseResponse: load<LockReleaseResponse>("gateway/lock_release.response.json")
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();

      if (method === "POST" && url.endsWith("/api/v1/session/start")) {
        return new Response(JSON.stringify(fixtures.sessionStartResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "POST" && url.endsWith("/api/v1/session/delta")) {
        return new Response(JSON.stringify(fixtures.deltaResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "POST" && url.endsWith("/api/v1/task/request")) {
        return new Response(JSON.stringify(fixtures.taskResponse), {
          status: 202,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "POST" && url.endsWith("/api/v1/task/plan-001/approval")) {
        return new Response(JSON.stringify(fixtures.approvalResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "POST" && url.endsWith("/api/v1/auth/handshake")) {
        return new Response(JSON.stringify(fixtures.handshakeResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "GET" && url.endsWith("/api/v1/tools")) {
        return new Response(JSON.stringify(fixtures.toolsListResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "POST" && url.endsWith("/api/v1/tools/invoke")) {
        return new Response(JSON.stringify(fixtures.toolsInvokeResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "POST" && url.endsWith("/api/v1/realtime/negotiate")) {
        return new Response(JSON.stringify(fixtures.realtimeNegotiateResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "GET" && url.endsWith("/api/v1/task/plan-001")) {
        return new Response(JSON.stringify(fixtures.taskStatusResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "GET" && url.endsWith("/api/v1/locks")) {
        return new Response(JSON.stringify(fixtures.locksListResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (method === "POST" && url.endsWith("/api/v1/locks/lock-001/release")) {
        return new Response(JSON.stringify(fixtures.lockReleaseResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { "content-type": "application/json" }
      });
    });

    const client = PhoenixClient.fromConfig({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: "local-token",
      authMode: "managed",
      fetchImpl: fetchMock as unknown as typeof fetch,
      retry: { maxRetries: 0, timeoutMs: 1000 }
    });

    const sessionStart = await client.sessionStart(fixtures.sessionStartRequest, {
      correlationHeaders: { "x-correlation-id": "corr-fixture" }
    });
    const delta = await client.sessionDelta(fixtures.deltaRequest, {
      idempotencyKey: "delta-1"
    });
    const task = await client.taskRequest(fixtures.taskRequest);
    const approval = await client.taskApproval("plan-001", fixtures.approvalRequest);
    const handshake = await client.authHandshake();
    const tools = await client.toolsList();
    const invoke = await client.toolsInvoke(fixtures.toolsInvokeRequest);
    const negotiate = await client.realtimeNegotiate(fixtures.realtimeNegotiateRequest);
    const taskStatus = await client.taskStatus("plan-001");
    const locks = await client.locksList();
    const lockRelease = await client.lockRelease("lock-001");

    expect(sessionStart).toEqual(fixtures.sessionStartResponse);
    expect(delta).toEqual(fixtures.deltaResponse);
    expect(task).toEqual(fixtures.taskResponse);
    expect(approval).toEqual(fixtures.approvalResponse);
    expect(handshake).toEqual(fixtures.handshakeResponse);
    expect(tools).toEqual(fixtures.toolsListResponse);
    expect(invoke).toEqual(fixtures.toolsInvokeResponse);
    expect(negotiate).toEqual(fixtures.realtimeNegotiateResponse);
    expect(taskStatus).toEqual(fixtures.taskStatusResponse);
    expect(locks).toEqual(fixtures.locksListResponse);
    expect(lockRelease).toEqual(fixtures.lockReleaseResponse);
    expect(fetchMock).toHaveBeenCalledTimes(11);

    const firstCall = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined] | undefined;
    const firstHeaders = new Headers(firstCall?.[1]?.headers);
    expect(firstHeaders.get("authorization")).toBe("Bearer local-token");
    expect(firstHeaders.get("x-phoenix-auth-mode")).toBe("managed");
    expect(firstHeaders.get("x-correlation-id")).toBe("corr-fixture");

    const secondCall = fetchMock.mock.calls[1] as [RequestInfo | URL, RequestInit | undefined] | undefined;
    const secondHeaders = new Headers(secondCall?.[1]?.headers);
    expect(secondHeaders.get("idempotency_key")).toBe("delta-1");
  });

  it("waits for plan ready using realtime first and task status fallback", async () => {
    const fixtures = {
      taskStatusResponse: load<TaskStatusResponse>("gateway/task_status.response.json"),
      planReadyEvent: load<RealtimeServerEvent>("realtime/plan_ready.json")
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/v1/task/plan-001")) {
        return new Response(JSON.stringify(fixtures.taskStatusResponse), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { "content-type": "application/json" }
      });
    });

    const client = PhoenixClient.fromConfig({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: "local-token",
      authMode: "managed",
      fetchImpl: fetchMock as unknown as typeof fetch,
      retry: { maxRetries: 0, timeoutMs: 1000 }
    });

    async function* events(): AsyncGenerator<RealtimeServerEvent> {
      yield fixtures.planReadyEvent;
    }

    const status = await client.waitForTaskReady("plan-001", {
      realtimeEvents: events(),
      realtimeWaitMs: 500,
      timeoutMs: 2000,
      pollIntervalMs: 10
    });

    expect(status).toEqual(fixtures.taskStatusResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("supports legacy sync task response during deprecation window", async () => {
    const fixtures = {
      taskRequest: load<TaskRequest>("task_request.request.json"),
      legacyBatch: load<TaskStatusResponse>("gateway/task_status.response.json").proposed_action_batch
    };

    if (!fixtures.legacyBatch) {
      throw new Error("gateway/task_status.response.json is missing proposed_action_batch fixture");
    }

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();

      if (method === "POST" && url.endsWith("/api/v1/task/request")) {
        return new Response(JSON.stringify(fixtures.legacyBatch), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { "content-type": "application/json" }
      });
    });

    const client = PhoenixClient.fromConfig({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: "local-token",
      authMode: "managed",
      fetchImpl: fetchMock as unknown as typeof fetch,
      retry: { maxRetries: 0, timeoutMs: 1000 }
    });

    const accepted = await client.taskRequest(fixtures.taskRequest);
    const status = await client.waitForTaskReady(accepted.plan_id, { timeoutMs: 100 });

    expect(accepted.event).toBe("task_queued_ack");
    expect(accepted.plan_id).toBe(fixtures.legacyBatch.plan_id);
    expect(status.proposed_action_batch).toEqual(fixtures.legacyBatch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
