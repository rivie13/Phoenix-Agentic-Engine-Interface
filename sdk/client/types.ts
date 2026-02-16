import type { PhoenixRequestOptions } from "../transport/types.js";
import type { RealtimeServerEvent } from "../validators/schemas.js";

export type { PhoenixRequestOptions, PhoenixTransportConfig, RetryConfig, TokenProvider } from "../transport/types.js";
export type {
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
  ProposedActionBatch,
  SessionStartAcceptedResponse,
  SessionStartSnapshotRequest,
  TaskRequest,
  TaskRequestAcceptedResponse,
  TaskStatusResponse,
  ToolInvokeRequest,
  ToolInvokeResponse,
  ToolListResponse
} from "../validators/schemas.js";

export interface WaitForTaskReadyOptions {
  readonly realtimeEvents?: AsyncIterable<RealtimeServerEvent>;
  readonly realtimeWaitMs?: number;
  readonly pollIntervalMs?: number;
  readonly timeoutMs?: number;
  readonly statusRequestOptions?: PhoenixRequestOptions;
}
