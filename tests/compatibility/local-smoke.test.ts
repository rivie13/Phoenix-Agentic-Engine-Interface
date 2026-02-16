import { describe, expect, it } from "vitest";
import { PhoenixClient } from "../../sdk/client/PhoenixClient.js";

const runSmoke = process.env.PHOENIX_RUN_SMOKE === "1";
const maybeDescribe = runSmoke ? describe : describe.skip;

maybeDescribe("Local backend smoke (optional)", () => {
  it("calls handshake, tools list, and tools invoke against local backend", async () => {
    const client = PhoenixClient.fromConfig({
      baseUrl: "http://127.0.0.1:8000",
      tokenProvider: process.env.PHOENIX_TEST_TOKEN ?? "local-dev-token",
      authMode: process.env.PHOENIX_AUTH_MODE,
      retry: {
        maxRetries: 1,
        timeoutMs: 2000,
        baseDelayMs: 100,
        maxDelayMs: 300
      }
    });

    const handshake = await client.authHandshake();
    const list = await client.toolsList();
    const invoke = await client.toolsInvoke({
      schema_version: "v1",
      tool_name: "mock.echo",
      arguments: {
        text: "ping"
      }
    });

    expect(handshake.schema_version).toBe("v1");
    expect(handshake.event).toBe("auth_handshake_ack");
    expect(list.schema_version).toBe("v1");
    expect(list.event).toBe("tool_list");
    expect(Array.isArray(list.tools)).toBe(true);
    expect(invoke.schema_version).toBe("v1");
    expect(invoke.event).toBe("tool_invoke_result");
    expect(invoke.tool_name).toBe("mock.echo");
  });
});
