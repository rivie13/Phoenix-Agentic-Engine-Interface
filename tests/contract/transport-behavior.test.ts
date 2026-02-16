import { describe, expect, it, vi } from "vitest";
import { PhoenixTransport } from "../../sdk/transport/phoenixTransport.js";
import { validateToolListResponse } from "../../sdk/validators/index.js";
import { PhoenixSdkError } from "../../sdk/transport/errors.js";

const jsonResponse = (status: number, payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      "x-correlation-id": "corr-123"
    }
  });

describe("Transport behavior", () => {
  it("retries transient 5xx and succeeds within bounded attempts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, { error: "temporary" }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          schema_version: "v1",
          event: "tool_list",
          tools: []
        })
      );

    const transport = new PhoenixTransport({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: "test-token",
      fetchImpl: fetchMock as unknown as typeof fetch,
      retry: {
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 3,
        timeoutMs: 1000
      }
    });

    const response = await transport.request({
      method: "GET",
      path: "/api/v1/tools",
      validate: validateToolListResponse
    });

    expect(response).toEqual({ schema_version: "v1", event: "tool_list", tools: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry 4xx errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(409, { code: "conflict", message: "session transition conflict" })
    );

    const transport = new PhoenixTransport({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: "test-token",
      fetchImpl: fetchMock as unknown as typeof fetch,
      retry: {
        maxRetries: 3,
        baseDelayMs: 1,
        maxDelayMs: 3,
        timeoutMs: 1000
      }
    });

    await expect(
      transport.request({
        method: "GET",
        path: "/api/v1/tools",
        validate: validateToolListResponse
      })
    ).rejects.toMatchObject({
      kind: "http",
      status: 409,
      retriable: false
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries timeout errors up to max retries", async () => {
    const abortError = new DOMException("timed out", "AbortError");
    const fetchMock = vi.fn().mockRejectedValue(abortError);

    const transport = new PhoenixTransport({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: "test-token",
      fetchImpl: fetchMock as unknown as typeof fetch,
      retry: {
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 3,
        timeoutMs: 2
      }
    });

    await expect(
      transport.request({
        method: "GET",
        path: "/api/v1/tools",
        validate: validateToolListResponse
      })
    ).rejects.toMatchObject({
      kind: "timeout",
      retriable: true
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("passes correlation headers through request options", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        schema_version: "v1",
        event: "tool_list",
        tools: []
      })
    );

    const transport = new PhoenixTransport({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: "test-token",
      authMode: "managed",
      fetchImpl: fetchMock as unknown as typeof fetch,
      retry: {
        maxRetries: 0,
        timeoutMs: 1000,
        baseDelayMs: 1,
        maxDelayMs: 2
      }
    });

    await transport.request({
      method: "GET",
      path: "/api/v1/tools",
      validate: validateToolListResponse,
      options: {
        correlationHeaders: {
          "x-correlation-id": "corr-local"
        }
      }
    });

    const call = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined] | undefined;
    const headers = new Headers(call?.[1]?.headers);

    expect(headers.get("authorization")).toBe("Bearer test-token");
    expect(headers.get("x-phoenix-auth-mode")).toBe("managed");
    expect(headers.get("x-correlation-id")).toBe("corr-local");
  });
});
