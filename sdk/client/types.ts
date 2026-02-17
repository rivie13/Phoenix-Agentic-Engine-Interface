import type { PhoenixRequestOptions } from "../transport/types.js";
import type { RealtimeServerEvent } from "../validators/schemas.js";
import type {
  RealtimeEventSourceLike,
  RealtimeEventStream,
  RealtimeTransportKind,
  RealtimeWebSocketLike
} from "../transport/realtimeEventStream.js";
import type { RealtimeNegotiateResponse, TaskStatusResponse } from "../validators/schemas.js";

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

export interface RealtimeTaskReadyFlowOptions {
  readonly sessionId: string;
  readonly userId: string;
  readonly planId: string;
  readonly transport?: RealtimeTransportKind;
  readonly signal?: AbortSignal;
  readonly webSocketFactory?: (url: string) => RealtimeWebSocketLike;
  readonly eventSourceFactory?: (url: string) => RealtimeEventSourceLike;
  readonly negotiateRequestOptions?: PhoenixRequestOptions;
  readonly waitForTaskReady?: Omit<WaitForTaskReadyOptions, "realtimeEvents">;
}

export interface RealtimeTaskReadyFlowResult {
  readonly negotiation: RealtimeNegotiateResponse;
  readonly realtimeEvents: RealtimeEventStream;
  readonly status: TaskStatusResponse;
}
