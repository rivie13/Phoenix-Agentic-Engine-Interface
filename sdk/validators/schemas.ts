import { z } from "zod";

const SchemaVersion = z.string().min(1);

const CommandActionSchema = z
  .object({
    id: z.string().min(1),
    action_type: z.enum(["create_file", "modify_text", "create_node", "chat_message"]),
    payload: z.record(z.unknown())
  })
  .strict();

const ToolDefinitionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    input_schema: z.record(z.unknown()).optional()
  })
  .strict();

const ToolErrorSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional()
  })
  .strict();

export const SessionStartSnapshotRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    project: z
      .object({
        name: z.string().min(1),
        path: z.string().min(1).optional()
      })
      .strict(),
    snapshot: z
      .object({
        captured_at: z.string().min(1),
        files: z
          .array(
            z
              .object({
                path: z.string().min(1),
                hash: z.string().min(1).optional(),
                content: z.string().optional()
              })
              .strict()
          )
          .min(0)
      })
      .strict()
  })
  .strict();

export const SessionStartAcceptedResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    accepted: z.boolean(),
    session_id: z.string().min(1),
    server_time: z.string().min(1).optional()
  })
  .strict();

export const DeltaUpdateRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    sequence: z.number().int().nonnegative(),
    deltas: z
      .array(
        z
          .object({
            path: z.string().min(1),
            op: z.enum(["upsert", "delete"]),
            content: z.string().optional(),
            hash: z.string().min(1).optional()
          })
          .strict()
      )
      .min(1)
  })
  .strict();

export const DeltaUpdateAcceptedResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    accepted: z.boolean(),
    session_id: z.string().min(1),
    sequence: z.number().int().nonnegative()
  })
  .strict();

export const TaskRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    user_request: z.string().min(1),
    mode: z.string().min(1),
    context: z.record(z.unknown()).optional()
  })
  .strict();

export const ProposedActionBatchSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    plan_id: z.string().min(1),
    requires_approval: z.boolean(),
    actions: z.array(CommandActionSchema).min(0),
    summary: z.string().optional()
  })
  .strict();

export const ApprovalDecisionRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    plan_id: z.string().min(1),
    decision: z.enum(["approve", "reject"]),
    reason: z.string().optional()
  })
  .strict();

export const CommandResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    plan_id: z.string().min(1),
    status: z.enum(["ready", "rejected", "error"]),
    commands: z.array(CommandActionSchema).min(0),
    message: z.string().optional()
  })
  .strict();

export const AuthHandshakeResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    status: z.enum(["ok", "failed"]),
    auth_mode: z.string().min(1).optional(),
    session_token: z.string().min(1).optional(),
    expires_at: z.string().min(1).optional()
  })
  .strict();

export const ToolListResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    tools: z.array(ToolDefinitionSchema)
  })
  .strict();

export const ToolInvokeRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    tool_name: z.string().min(1),
    args: z.record(z.unknown()),
    invocation_id: z.string().min(1).optional(),
    session_id: z.string().min(1).optional()
  })
  .strict();

export const ToolInvokeResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    tool_name: z.string().min(1),
    status: z.enum(["ok", "error"]),
    result: z.unknown().optional(),
    error: ToolErrorSchema.optional()
  })
  .strict();

export type SessionStartSnapshotRequest = z.infer<typeof SessionStartSnapshotRequestSchema>;
export type SessionStartAcceptedResponse = z.infer<typeof SessionStartAcceptedResponseSchema>;
export type DeltaUpdateRequest = z.infer<typeof DeltaUpdateRequestSchema>;
export type DeltaUpdateAcceptedResponse = z.infer<typeof DeltaUpdateAcceptedResponseSchema>;
export type TaskRequest = z.infer<typeof TaskRequestSchema>;
export type ProposedActionBatch = z.infer<typeof ProposedActionBatchSchema>;
export type ApprovalDecisionRequest = z.infer<typeof ApprovalDecisionRequestSchema>;
export type CommandResponse = z.infer<typeof CommandResponseSchema>;
export type AuthHandshakeResponse = z.infer<typeof AuthHandshakeResponseSchema>;
export type ToolListResponse = z.infer<typeof ToolListResponseSchema>;
export type ToolInvokeRequest = z.infer<typeof ToolInvokeRequestSchema>;
export type ToolInvokeResponse = z.infer<typeof ToolInvokeResponseSchema>;

export const FixtureSchemaByFileName = {
  "session_start.request.json": SessionStartSnapshotRequestSchema,
  "session_start.response.json": SessionStartAcceptedResponseSchema,
  "delta_update.request.json": DeltaUpdateRequestSchema,
  "delta_update.response.json": DeltaUpdateAcceptedResponseSchema,
  "task_request.request.json": TaskRequestSchema,
  "task_request.response.json": ProposedActionBatchSchema,
  "approval_decision.request.json": ApprovalDecisionRequestSchema,
  "approval_decision.response.json": CommandResponseSchema,
  "auth_handshake.response.json": AuthHandshakeResponseSchema,
  "tools_list.response.json": ToolListResponseSchema,
  "tools_invoke.request.json": ToolInvokeRequestSchema,
  "tools_invoke.response.json": ToolInvokeResponseSchema
} as const;
