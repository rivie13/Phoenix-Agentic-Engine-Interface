import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CommandResponseSchema,
  TaskStatusResponseSchema,
  ToolResultAcceptedResponseSchema,
  ToolResultSchema
} from "../../sdk/validators/schemas.js";

const fixtureRoot = fileURLToPath(new URL("../../contracts/v1", import.meta.url));

describe("PR-1 protocol validation", () => {
  it("validates execute_local_mcp command payload with the action literal", () => {
    const payload = {
      schema_version: "v1",
      session_id: "sess-001",
      plan_id: "plan-001",
      commands: [
        {
          action: "execute_local_mcp",
          content:
            '{"server":"godot-mcp-docs","tool":"get_documentation_file","params":{"file_path":"classes/class_node2d.md"},"tool_call_id":"tc-001"}',
          agent: "docs"
        }
      ],
      requires_approval: false
    };

    const parsed = CommandResponseSchema.parse(payload);
    expect(parsed.commands[0]?.action).toBe("execute_local_mcp");
  });

  it("validates tool_result.request fixture", () => {
    const fixture = JSON.parse(readFileSync(join(fixtureRoot, "tool_result.request.json"), "utf8"));
    const parsed = ToolResultSchema.parse(fixture);

    expect(parsed.plan_id).toBe("plan-001");
    expect(parsed.error).toBeNull();
  });

  it("validates tool_result.response fixture", () => {
    const fixture = JSON.parse(readFileSync(join(fixtureRoot, "tool_result.response.json"), "utf8"));
    const parsed = ToolResultAcceptedResponseSchema.parse(fixture);

    expect(parsed.event).toBe("tool_result_ack");
    expect(parsed.accepted).toBe(true);
  });

  it("accepts awaiting_tool_results task status", () => {
    const payload = {
      schema_version: "v1",
      plan_id: "plan-001",
      job_id: "job-001",
      session_id: "sess-001",
      status: "awaiting_tool_results",
      tier: "managed",
      updated_at: "2026-02-19T00:00:00Z"
    };

    const parsed = TaskStatusResponseSchema.parse(payload);
    expect(parsed.status).toBe("awaiting_tool_results");
  });

  it("continues to validate legacy command variants", () => {
    const legacyCommands = [
      {
        action: "create_file",
        path: "res://scripts/player.gd",
        content: "extends Node2D"
      },
      {
        action: "modify_text",
        file: "res://scripts/player.gd",
        search: "Node2D",
        replace: "CharacterBody2D"
      },
      {
        action: "create_node",
        parent: ".",
        type: "Node2D",
        name: "Player",
        properties: { speed: 200 }
      },
      {
        action: "chat_message",
        content: "Ready to proceed",
        agent: "planner"
      }
    ] as const;

    for (const command of legacyCommands) {
      const payload = {
        schema_version: "v1",
        session_id: "sess-001",
        plan_id: "plan-001",
        commands: [command],
        requires_approval: false
      };

      expect(() => CommandResponseSchema.parse(payload)).not.toThrow();
    }
  });

  it("rejects unknown command actions", () => {
    const payload = {
      schema_version: "v1",
      session_id: "sess-001",
      plan_id: "plan-001",
      commands: [
        {
          action: "unknown_action",
          content: "noop",
          agent: "docs"
        }
      ],
      requires_approval: false
    };

    expect(() => CommandResponseSchema.parse(payload)).toThrow();
  });
});
