import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { PhoenixClient } from "../../sdk/client/PhoenixClient.js";
import type { RealtimeServerEvent, RealtimeNegotiateResponse, TaskStatusResponse } from "../../sdk/validators/schemas.js";

const fixtureRoot = fileURLToPath(new URL("../../contracts/v1", import.meta.url));

const load = <T>(file: string): T => JSON.parse(readFileSync(join(fixtureRoot, file), "utf8")) as T;

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

describe("Realtime task-ready helper flow", () => {
  it("negotiates realtime and resolves task readiness from plan.ready event", async () => {
    const fixtures = {
      negotiateResponse: load<RealtimeNegotiateResponse>("gateway/realtime_negotiate.response.json"),
      taskStatusResponse: load<TaskStatusResponse>("gateway/task_status.response.json"),
      planReadyEvent: load<RealtimeServerEvent>("realtime/plan_ready.json")
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();

      if (method === "POST" && url.endsWith("/api/v1/realtime/negotiate")) {
        return new Response(JSON.stringify(fixtures.negotiateResponse), {
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

      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { "content-type": "application/json" }
      });
    });

    const socket = new FakeRealtimeSocket();

    const client = PhoenixClient.fromConfig({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: "local-token",
      authMode: "managed",
      fetchImpl: fetchMock as unknown as typeof fetch,
      retry: { maxRetries: 0, timeoutMs: 1000 }
    });

    const resultPromise = client.negotiateRealtimeAndWaitForTaskReady({
      sessionId: "sess-001",
      userId: "user-001",
      planId: "plan-001",
      transport: "websocket",
      webSocketFactory: () => socket,
      waitForTaskReady: {
        timeoutMs: 1000,
        realtimeWaitMs: 300,
        pollIntervalMs: 10
      }
    });

    setTimeout(() => {
      socket.emit("message", {
        data: JSON.stringify(fixtures.planReadyEvent)
      });
    }, 0);

    const result = await resultPromise;

    expect(result.negotiation).toEqual(fixtures.negotiateResponse);
    expect(result.status).toEqual(fixtures.taskStatusResponse);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    result.realtimeEvents.close();
  });
});