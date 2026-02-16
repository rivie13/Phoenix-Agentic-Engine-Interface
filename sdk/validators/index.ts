import {
  ApprovalDecisionRequestSchema,
  AuthHandshakeResponseSchema,
  LockReleaseResponseSchema,
  LocksListResponseSchema,
  RealtimeNegotiateRequestSchema,
  RealtimeNegotiateResponseSchema,
  RealtimeServerEventSchema,
  CommandResponseSchema,
  DeltaUpdateAcceptedResponseSchema,
  DeltaUpdateRequestSchema,
  ProposedActionBatchSchema,
  SessionStartAcceptedResponseSchema,
  SessionStartSnapshotRequestSchema,
  TaskRequestSchema,
  TaskRequestAcceptedResponseSchema,
  TaskStatusResponseSchema,
  ToolInvokeRequestSchema,
  ToolInvokeResponseSchema,
  ToolListResponseSchema,
  type ApprovalDecisionRequest,
  type AuthHandshakeResponse,
  type LockReleaseResponse,
  type LocksListResponse,
  type RealtimeNegotiateRequest,
  type RealtimeNegotiateResponse,
  type RealtimeServerEvent,
  type CommandResponse,
  type DeltaUpdateAcceptedResponse,
  type DeltaUpdateRequest,
  type ProposedActionBatch,
  type SessionStartAcceptedResponse,
  type SessionStartSnapshotRequest,
  type TaskRequest,
  type TaskRequestAcceptedResponse,
  type TaskStatusResponse,
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

export const validateTaskRequestAcceptedResponse = (payload: unknown): TaskRequestAcceptedResponse =>
  TaskRequestAcceptedResponseSchema.parse(payload);

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

export const validateRealtimeNegotiateRequest = (payload: unknown): RealtimeNegotiateRequest =>
  RealtimeNegotiateRequestSchema.parse(payload);

export const validateRealtimeNegotiateResponse = (payload: unknown): RealtimeNegotiateResponse =>
  RealtimeNegotiateResponseSchema.parse(payload);

export const validateTaskStatusResponse = (payload: unknown): TaskStatusResponse =>
  TaskStatusResponseSchema.parse(payload);

export const validateLocksListResponse = (payload: unknown): LocksListResponse => LocksListResponseSchema.parse(payload);

export const validateLockReleaseResponse = (payload: unknown): LockReleaseResponse =>
  LockReleaseResponseSchema.parse(payload);

export const validateRealtimeServerEvent = (payload: unknown): RealtimeServerEvent =>
  RealtimeServerEventSchema.parse(payload);
