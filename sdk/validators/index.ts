import {
  ApprovalDecisionRequestSchema,
  AuthHandshakeResponseSchema,
  CommandResponseSchema,
  DeltaUpdateAcceptedResponseSchema,
  DeltaUpdateRequestSchema,
  ProposedActionBatchSchema,
  SessionStartAcceptedResponseSchema,
  SessionStartSnapshotRequestSchema,
  TaskRequestSchema,
  ToolInvokeRequestSchema,
  ToolInvokeResponseSchema,
  ToolListResponseSchema,
  type ApprovalDecisionRequest,
  type AuthHandshakeResponse,
  type CommandResponse,
  type DeltaUpdateAcceptedResponse,
  type DeltaUpdateRequest,
  type ProposedActionBatch,
  type SessionStartAcceptedResponse,
  type SessionStartSnapshotRequest,
  type TaskRequest,
  type ToolInvokeRequest,
  type ToolInvokeResponse,
  type ToolListResponse
} from "./schemas.js";

export const validateSessionStartSnapshotRequest = (payload: unknown): SessionStartSnapshotRequest =>
  SessionStartSnapshotRequestSchema.parse(payload);

export const validateSessionStartAcceptedResponse = (payload: unknown): SessionStartAcceptedResponse =>
  SessionStartAcceptedResponseSchema.parse(payload);

export const validateDeltaUpdateRequest = (payload: unknown): DeltaUpdateRequest => DeltaUpdateRequestSchema.parse(payload);

export const validateDeltaUpdateAcceptedResponse = (payload: unknown): DeltaUpdateAcceptedResponse =>
  DeltaUpdateAcceptedResponseSchema.parse(payload);

export const validateTaskRequest = (payload: unknown): TaskRequest => TaskRequestSchema.parse(payload);

export const validateProposedActionBatch = (payload: unknown): ProposedActionBatch =>
  ProposedActionBatchSchema.parse(payload);

export const validateApprovalDecisionRequest = (payload: unknown): ApprovalDecisionRequest =>
  ApprovalDecisionRequestSchema.parse(payload);

export const validateCommandResponse = (payload: unknown): CommandResponse => CommandResponseSchema.parse(payload);

export const validateAuthHandshakeResponse = (payload: unknown): AuthHandshakeResponse =>
  AuthHandshakeResponseSchema.parse(payload);

export const validateToolListResponse = (payload: unknown): ToolListResponse => ToolListResponseSchema.parse(payload);

export const validateToolInvokeRequest = (payload: unknown): ToolInvokeRequest => ToolInvokeRequestSchema.parse(payload);

export const validateToolInvokeResponse = (payload: unknown): ToolInvokeResponse =>
  ToolInvokeResponseSchema.parse(payload);
