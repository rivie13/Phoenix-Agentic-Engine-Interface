import { z } from "zod";

const SchemaVersion = z.literal("v1");

const CreateFileCommandSchema = z
  .object({
    action: z.literal("create_file"),
    path: z.string().min(1),
    content: z.string().optional(),
    data_base64: z.string().optional(),
    import_as: z.string().optional()
  })
  .strict();

const ModifyTextCommandSchema = z
  .object({
    action: z.literal("modify_text"),
    file: z.string().min(1),
    search: z.string().min(1),
    replace: z.string().optional(),
    content: z.string().optional(),
    insert_after: z.boolean().optional()
  })
  .strict();

const CreateNodeCommandSchema = z
  .object({
    action: z.literal("create_node"),
    parent: z.string().min(1),
    type: z.string().min(1),
    name: z.string().min(1),
    properties: z.record(z.unknown()).default({})
  })
  .strict();

const ChatMessageCommandSchema = z
  .object({
    action: z.literal("chat_message"),
    content: z.string().min(1),
    agent: z.string().min(1)
  })
  .strict();

const ExecuteLocalMcpCommandSchema = z
  .object({
    action: z.literal("execute_local_mcp"),
    content: z.string().min(1),
    agent: z.string().min(1)
  })
  .strict();

const CommandSchema = z.discriminatedUnion("action", [
  CreateFileCommandSchema,
  ModifyTextCommandSchema,
  CreateNodeCommandSchema,
  ChatMessageCommandSchema,
  ExecuteLocalMcpCommandSchema
]).superRefine((payload, ctx) => {
  if (payload.action === "create_file" && !payload.content && !payload.data_base64) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "create_file requires either content or data_base64"
    });
  }

  if (payload.action === "modify_text" && !payload.replace && !payload.content) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "modify_text requires either replace or content"
    });
  }
});

const ToolDefinitionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1)
  })
  .strict();

export const SessionStartSnapshotRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("session_start"),
    session_id: z.string().min(1),
    idempotency_key: z.string().min(1),
    sent_at: z.string().min(1),
    project_map: z
      .object({
        name: z.string().min(1),
        godot_version: z.string().min(1),
        main_scene: z.string().min(1),
        scenes: z.record(
          z
            .object({
              root: z.string().min(1),
              root_type: z.string().min(1),
              children_summary: z.array(z.string()).default([])
            })
            .strict()
        ),
        scripts: z.array(z.string()).default([]),
        resources: z
          .object({
            audio: z.array(z.string()).default([]),
            sprites: z.array(z.string()).default([]),
            tilesets: z.array(z.string()).default([])
          })
          .strict(),
        file_hash: z.string().min(1),
        extras: z.record(z.unknown()).default({})
      })
      .strict()
  })
  .strict();

export const SessionStartAcceptedResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("session_start_ack"),
    accepted: z.boolean(),
    session_id: z.string().min(1)
  })
  .strict();

export const DeltaUpdateRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("scene_changed"),
    session_id: z.string().min(1),
    idempotency_key: z.string().min(1),
    sequence: z.number().int().min(1),
    sent_at: z.string().min(1),
    scene: z.string().min(1),
    delta: z
      .object({
        added_nodes: z
          .array(
            z
              .object({
                name: z.string().min(1),
                type: z.string().min(1),
                parent: z.string().min(1),
                properties: z.record(z.unknown()).default({})
              })
              .strict()
          )
          .default([]),
        removed_nodes: z
          .array(
            z
              .object({
                path: z.string().min(1)
              })
              .strict()
          )
          .default([]),
        modified_properties: z
          .array(
            z
              .object({
                node: z.string().min(1),
                property: z.string().min(1),
                value: z.unknown()
              })
              .strict()
          )
          .default([])
      })
      .strict()
      .superRefine((payload, ctx) => {
        if (
          payload.added_nodes.length === 0 &&
          payload.removed_nodes.length === 0 &&
          payload.modified_properties.length === 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "delta must include at least one change"
          });
        }
      })
  })
  .strict();

export const DeltaUpdateAcceptedResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("scene_changed_ack"),
    accepted: z.boolean(),
    session_id: z.string().min(1),
    sequence: z.number().int().min(1)
  })
  .strict();

export const TaskRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    task_id: z.string().min(1),
    user_input: z.string().min(1),
    mode: z.enum(["ask", "plan", "agent"]),
    submitted_at: z.string().min(1),
    project_context: z
      .object({
        current_file: z.string().nullable().optional(),
        scene_tree: z.record(z.unknown()).default({}),
        open_files: z.array(z.string()).default([]),
        project_settings: z.record(z.unknown()).default({})
      })
      .strict()
  })
  .strict();

export const TaskRequestAcceptedResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("task_queued_ack"),
    accepted: z.boolean(),
    session_id: z.string().min(1),
    task_id: z.string().min(1),
    plan_id: z.string().min(1),
    job_id: z.string().min(1),
    status: z.literal("queued"),
    tier: z.string().min(1)
  })
  .strict();

export const ProposedActionSchema = z
  .object({
    action_id: z.string().min(1),
    command: CommandSchema,
    risk_level: z.enum(["low", "medium", "high", "destructive"]),
    reason_code: z.string().min(1),
    requires_approval: z.boolean()
  })
  .strict();

export const ProposedActionBatchSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    plan_id: z.string().min(1),
    actions: z.array(ProposedActionSchema).min(1),
    requires_approval: z.boolean(),
    approval_summary: z.string().nullable().optional(),
    proposed_at: z.string().min(1)
  })
  .strict()
  .superRefine((payload, ctx) => {
    if (payload.requires_approval && !payload.approval_summary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "approval_summary is required when requires_approval is true"
      });
    }
  });

export const ApprovalDecisionRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    plan_id: z.string().min(1),
    decision: z.enum(["approve", "reject"]),
    approved_action_ids: z.array(z.string()).default([]),
    rejected_action_ids: z.array(z.string()).default([]),
    reviewer_id: z.string().min(1),
    decided_at: z.string().min(1)
  })
  .strict()
  .superRefine((payload, ctx) => {
    const hasApproved = payload.approved_action_ids.length > 0;
    const hasRejected = payload.rejected_action_ids.length > 0;

    if (payload.decision === "approve" && (!hasApproved || hasRejected)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "approve decision requires approved_action_ids and no rejected_action_ids"
      });
    }

    if (payload.decision === "reject" && (!hasRejected || hasApproved)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "reject decision requires rejected_action_ids and no approved_action_ids"
      });
    }
  });

export const CommandResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    plan_id: z.string().min(1),
    commands: z.array(CommandSchema).min(1),
    requires_approval: z.boolean(),
    approval_summary: z.string().nullable().optional(),
    correlation_id: z.string().nullable().optional()
  })
  .strict()
  .superRefine((payload, ctx) => {
    if (payload.requires_approval && !payload.approval_summary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "approval_summary is required when requires_approval is true"
      });
    }
  });

export const AuthHandshakeResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("auth_handshake_ack"),
    mode: z.enum(["byok", "managed"]),
    actor_id: z.string().min(1),
    token_fingerprint: z.string().length(16)
  })
  .strict();

export const ToolListResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("tool_list"),
    tools: z.array(ToolDefinitionSchema)
  })
  .strict();

export const ToolInvokeRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    tool_name: z.string().min(1),
    arguments: z.record(z.unknown()).default({})
  })
  .strict();

export const ToolInvokeResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("tool_invoke_result"),
    tool_name: z.string().min(1),
    output: z.record(z.unknown()).default({}),
    mode: z.enum(["byok", "managed"]),
    actor_id: z.string().min(1),
    correlation_id: z.string().nullable().optional()
  })
  .strict();

export const RealtimeNegotiateRequestSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    user_id: z.string().min(1)
  })
  .strict();

export const RealtimeNegotiateResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("realtime_negotiate_ack"),
    session_id: z.string().min(1),
    user_id: z.string().min(1),
    url: z.string().min(1),
    access_token: z.string().min(1),
    groups: z.array(z.string()).min(1)
  })
  .strict();

export const TaskStatusResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    plan_id: z.string().min(1),
    job_id: z.string().min(1),
    session_id: z.string().min(1),
    status: z.enum([
      "queued",
      "planning",
      "awaiting_tool_results",
      "awaiting_approval",
      "approved",
      "executing",
      "done",
      "error"
    ]),
    tier: z.string().min(1),
    updated_at: z.string().min(1),
    proposed_action_batch: ProposedActionBatchSchema.nullable().optional()
  })
  .strict();

export const ToolResultSchema = z
  .object({
    schema_version: SchemaVersion,
    session_id: z.string().min(1),
    plan_id: z.string().min(1),
    tool_call_id: z.string().min(1),
    output: z.record(z.unknown()).nullable(),
    error: z.string().nullable(),
    timing_ms: z.number().int().nonnegative()
  })
  .strict();

export const ToolResultAcceptedResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("tool_result_ack"),
    accepted: z.boolean(),
    plan_id: z.string().min(1),
    tool_call_id: z.string().min(1)
  })
  .strict();

export const ResourceLockSchema = z
  .object({
    lock_id: z.string().min(1),
    resource_type: z.string().min(1),
    resource_path: z.string().min(1),
    lock_type: z.string().min(1),
    holder_type: z.string().min(1),
    holder_id: z.string().min(1),
    holder_display_name: z.string().nullable().optional(),
    plan_id: z.string().nullable().optional(),
    reason: z.string().nullable().optional(),
    acquired_at: z.string().min(1),
    expires_at: z.string().min(1),
    session_id: z.string().min(1)
  })
  .strict();

export const LocksListResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    locks: z.array(ResourceLockSchema)
  })
  .strict();

export const LockReleaseResponseSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("lock_released"),
    released: z.boolean(),
    lock_id: z.string().min(1)
  })
  .strict();

export const ChatDeltaEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("chat.delta"),
    plan_id: z.string().min(1),
    seq: z.number().int().min(1),
    text: z.string()
  })
  .strict();

export const ChatDoneEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("chat.done"),
    plan_id: z.string().min(1)
  })
  .strict();

export const OrchStepStartEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("orch.step.start"),
    plan_id: z.string().min(1),
    step_id: z.string().min(1),
    agent: z.string().min(1),
    description: z.string().min(1)
  })
  .strict();

export const OrchStepLogEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("orch.step.log"),
    plan_id: z.string().min(1),
    step_id: z.string().min(1),
    message: z.string().min(1)
  })
  .strict();

export const OrchStepEndEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("orch.step.end"),
    plan_id: z.string().min(1),
    step_id: z.string().min(1),
    status: z.string().min(1)
  })
  .strict();

export const JobQueuedEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("job.queued"),
    job_id: z.string().min(1),
    plan_id: z.string().min(1),
    tier: z.string().min(1)
  })
  .strict();

export const PlanReadyEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("plan.ready"),
    plan_id: z.string().min(1),
    action_count: z.number().int().nonnegative(),
    requires_approval: z.boolean()
  })
  .strict();

export const JobStartedEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("job.started"),
    job_id: z.string().min(1),
    worker_id: z.string().min(1)
  })
  .strict();

export const JobDoneEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("job.done"),
    job_id: z.string().min(1),
    result_summary: z.string().min(1)
  })
  .strict();

export const JobErrorEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("job.error"),
    job_id: z.string().min(1),
    error_code: z.string().min(1),
    message: z.string().min(1)
  })
  .strict();

export const JobExpiredEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("job.expired"),
    job_id: z.string().min(1),
    reason: z.string().min(1)
  })
  .strict();

export const LockAcquiredEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("lock.acquired"),
    session_id: z.string().min(1),
    resource_path: z.string().min(1),
    resource_type: z.string().min(1),
    agent_id: z.string().min(1),
    plan_id: z.string().min(1),
    expires_at: z.string().min(1)
  })
  .strict();

export const LockReleasedEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("lock.released"),
    session_id: z.string().min(1),
    resource_path: z.string().min(1),
    agent_id: z.string().min(1)
  })
  .strict();

export const LockConflictEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("lock.conflict"),
    session_id: z.string().min(1),
    resource_path: z.string().min(1),
    holder_agent_id: z.string().min(1),
    requester: z.string().min(1)
  })
  .strict();

export const SessionResyncRequiredEventSchema = z
  .object({
    schema_version: SchemaVersion,
    event: z.literal("session.resync_required"),
    session_id: z.string().min(1),
    reason: z.string().min(1),
    last_confirmed_seq: z.number().int().nonnegative()
  })
  .strict();

export const RealtimeServerEventSchema = z.discriminatedUnion("event", [
  ChatDeltaEventSchema,
  ChatDoneEventSchema,
  OrchStepStartEventSchema,
  OrchStepLogEventSchema,
  OrchStepEndEventSchema,
  JobQueuedEventSchema,
  PlanReadyEventSchema,
  JobStartedEventSchema,
  JobDoneEventSchema,
  JobErrorEventSchema,
  JobExpiredEventSchema,
  LockAcquiredEventSchema,
  LockReleasedEventSchema,
  LockConflictEventSchema,
  SessionResyncRequiredEventSchema
]);

export type SessionStartSnapshotRequest = z.infer<typeof SessionStartSnapshotRequestSchema>;
export type SessionStartAcceptedResponse = z.infer<typeof SessionStartAcceptedResponseSchema>;
export type DeltaUpdateRequest = z.infer<typeof DeltaUpdateRequestSchema>;
export type DeltaUpdateAcceptedResponse = z.infer<typeof DeltaUpdateAcceptedResponseSchema>;
export type TaskRequest = z.infer<typeof TaskRequestSchema>;
export type TaskRequestAcceptedResponse = z.infer<typeof TaskRequestAcceptedResponseSchema>;
export type ProposedAction = z.infer<typeof ProposedActionSchema>;
export type ProposedActionBatch = z.infer<typeof ProposedActionBatchSchema>;
export type ApprovalDecisionRequest = z.infer<typeof ApprovalDecisionRequestSchema>;
export type CommandResponse = z.infer<typeof CommandResponseSchema>;
export type AuthHandshakeResponse = z.infer<typeof AuthHandshakeResponseSchema>;
export type ToolListResponse = z.infer<typeof ToolListResponseSchema>;
export type ToolInvokeRequest = z.infer<typeof ToolInvokeRequestSchema>;
export type ToolInvokeResponse = z.infer<typeof ToolInvokeResponseSchema>;
export type RealtimeNegotiateRequest = z.infer<typeof RealtimeNegotiateRequestSchema>;
export type RealtimeNegotiateResponse = z.infer<typeof RealtimeNegotiateResponseSchema>;
export type TaskStatusResponse = z.infer<typeof TaskStatusResponseSchema>;
export type ToolResult = z.infer<typeof ToolResultSchema>;
export type ToolResultAcceptedResponse = z.infer<typeof ToolResultAcceptedResponseSchema>;
export type ResourceLock = z.infer<typeof ResourceLockSchema>;
export type LocksListResponse = z.infer<typeof LocksListResponseSchema>;
export type LockReleaseResponse = z.infer<typeof LockReleaseResponseSchema>;
export type PlanReadyEvent = z.infer<typeof PlanReadyEventSchema>;
export type RealtimeServerEvent = z.infer<typeof RealtimeServerEventSchema>;

export const FixtureSchemaByFileName = {
  "session_start.request.json": SessionStartSnapshotRequestSchema,
  "session_start.response.json": SessionStartAcceptedResponseSchema,
  "delta_update.request.json": DeltaUpdateRequestSchema,
  "delta_update.response.json": DeltaUpdateAcceptedResponseSchema,
  "task_request.request.json": TaskRequestSchema,
  "task_request.response.json": TaskRequestAcceptedResponseSchema,
  "approval_decision.request.json": ApprovalDecisionRequestSchema,
  "approval_decision.response.json": CommandResponseSchema,
  "auth_handshake.response.json": AuthHandshakeResponseSchema,
  "tools_list.response.json": ToolListResponseSchema,
  "tools_invoke.request.json": ToolInvokeRequestSchema,
  "tools_invoke.response.json": ToolInvokeResponseSchema,
  "tool_result.request.json": ToolResultSchema,
  "tool_result.response.json": ToolResultAcceptedResponseSchema,
  "gateway/realtime_negotiate.request.json": RealtimeNegotiateRequestSchema,
  "gateway/realtime_negotiate.response.json": RealtimeNegotiateResponseSchema,
  "gateway/task_status.response.json": TaskStatusResponseSchema,
  "gateway/locks_list.response.json": LocksListResponseSchema,
  "gateway/lock_release.response.json": LockReleaseResponseSchema,
  "realtime/chat_delta.json": ChatDeltaEventSchema,
  "realtime/chat_done.json": ChatDoneEventSchema,
  "realtime/orch_step_start.json": OrchStepStartEventSchema,
  "realtime/orch_step_log.json": OrchStepLogEventSchema,
  "realtime/orch_step_end.json": OrchStepEndEventSchema,
  "realtime/job_queued.json": JobQueuedEventSchema,
  "realtime/plan_ready.json": PlanReadyEventSchema,
  "realtime/job_started.json": JobStartedEventSchema,
  "realtime/job_done.json": JobDoneEventSchema,
  "realtime/job_error.json": JobErrorEventSchema,
  "realtime/job_expired.json": JobExpiredEventSchema,
  "realtime/lock_acquired.json": LockAcquiredEventSchema,
  "realtime/lock_released.json": LockReleasedEventSchema,
  "realtime/lock_conflict.json": LockConflictEventSchema,
  "realtime/session_resync_required.json": SessionResyncRequiredEventSchema
} as const;
