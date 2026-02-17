import {
  validateLockReleaseResponse,
  validateLocksListResponse,
  validateRealtimeNegotiateRequest,
  validateRealtimeNegotiateResponse,
  validateApprovalDecisionRequest,
  validateAuthHandshakeResponse,
  validateCommandResponse,
  validateDeltaUpdateAcceptedResponse,
  validateDeltaUpdateRequest,
  validateProposedActionBatch,
  validateSessionStartAcceptedResponse,
  validateSessionStartSnapshotRequest,
  validateTaskRequest,
  validateTaskRequestAcceptedResponse,
  validateTaskStatusResponse,
  validateToolInvokeRequest,
  validateToolInvokeResponse,
  validateToolListResponse
} from "../validators/index.js";
import type {
  ApprovalDecisionRequest,
  AuthHandshakeResponse,
  CommandResponse,
  DeltaUpdateAcceptedResponse,
  DeltaUpdateRequest,
  LockReleaseResponse,
  LocksListResponse,
  RealtimeNegotiateRequest,
  RealtimeNegotiateResponse,
  ProposedActionBatch,
  SessionStartAcceptedResponse,
  SessionStartSnapshotRequest,
  TaskRequest,
  TaskRequestAcceptedResponse,
  TaskStatusResponse,
  RealtimeServerEvent,
  ToolInvokeRequest,
  ToolInvokeResponse,
  ToolListResponse
} from "../validators/schemas.js";
import { createRealtimeEventStream } from "../transport/realtimeEventStream.js";
import type { RealtimeTaskReadyFlowOptions, RealtimeTaskReadyFlowResult, WaitForTaskReadyOptions } from "./types.js";
import { PhoenixSdkError } from "../transport/errors.js";
import { PhoenixTransport } from "../transport/phoenixTransport.js";
import type { PhoenixRequestOptions, PhoenixTransportConfig } from "../transport/types.js";

const LEGACY_SYNC_TASK_RESPONSE_DEPRECATION_UNTIL_MS = Date.parse("2026-06-30T00:00:00Z");
const DEFAULT_WAIT_FOR_TASK_READY_TIMEOUT_MS = 30_000;
const DEFAULT_WAIT_FOR_TASK_READY_REALTIME_MS = 5_000;
const DEFAULT_WAIT_FOR_TASK_READY_POLL_INTERVAL_MS = 1_000;

export class PhoenixClient {
  private readonly transport: PhoenixTransport;
  private readonly legacyReadyByPlanId = new Map<string, ProposedActionBatch>();

  public constructor(transport: PhoenixTransport) {
    this.transport = transport;
  }

  public static fromConfig(config: PhoenixTransportConfig): PhoenixClient {
    return new PhoenixClient(new PhoenixTransport(config));
  }

  public async sessionStart(
    request: SessionStartSnapshotRequest,
    options?: PhoenixRequestOptions
  ): Promise<SessionStartAcceptedResponse> {
    const payload = validateSessionStartSnapshotRequest(request);
    return this.transport.request<SessionStartAcceptedResponse>({
      method: "POST",
      path: "/api/v1/session/start",
      body: payload,
      options,
      validate: validateSessionStartAcceptedResponse
    });
  }

  public async sessionDelta(
    request: DeltaUpdateRequest,
    options?: PhoenixRequestOptions
  ): Promise<DeltaUpdateAcceptedResponse> {
    const payload = validateDeltaUpdateRequest(request);
    return this.transport.request<DeltaUpdateAcceptedResponse>({
      method: "POST",
      path: "/api/v1/session/delta",
      body: payload,
      options,
      validate: validateDeltaUpdateAcceptedResponse
    });
  }

  public async taskRequest(
    request: TaskRequest,
    options?: PhoenixRequestOptions
  ): Promise<TaskRequestAcceptedResponse> {
    const payload = validateTaskRequest(request);
    const responsePayload = await this.transport.request<unknown>({
      method: "POST",
      path: "/api/v1/task/request",
      body: payload,
      options
    });

    try {
      return validateTaskRequestAcceptedResponse(responsePayload);
    } catch {
      if (!this.isLegacyTaskResponseWindowOpen()) {
        throw new PhoenixSdkError({
          kind: "validation",
          message: "task/request response does not match TaskRequestAcceptedResponse",
          retriable: false,
          details: responsePayload
        });
      }

      const legacyBatch = validateProposedActionBatch(responsePayload);
      this.legacyReadyByPlanId.set(legacyBatch.plan_id, legacyBatch);

      return {
        schema_version: legacyBatch.schema_version,
        event: "task_queued_ack",
        accepted: true,
        session_id: legacyBatch.session_id,
        task_id: request.task_id,
        plan_id: legacyBatch.plan_id,
        job_id: `legacy-${legacyBatch.plan_id}`,
        status: "queued",
        tier: "legacy"
      };
    }
  }

  public async taskApproval(
    planId: string,
    request: ApprovalDecisionRequest,
    options?: PhoenixRequestOptions
  ): Promise<CommandResponse> {
    const payload = validateApprovalDecisionRequest(request);
    return this.transport.request<CommandResponse>({
      method: "POST",
      path: `/api/v1/task/${encodeURIComponent(planId)}/approval`,
      body: payload,
      options,
      validate: validateCommandResponse
    });
  }

  public async authHandshake(options?: PhoenixRequestOptions): Promise<AuthHandshakeResponse> {
    return this.transport.request<AuthHandshakeResponse>({
      method: "POST",
      path: "/api/v1/auth/handshake",
      options,
      validate: validateAuthHandshakeResponse
    });
  }

  public async toolsList(options?: PhoenixRequestOptions): Promise<ToolListResponse> {
    return this.transport.request<ToolListResponse>({
      method: "GET",
      path: "/api/v1/tools",
      options,
      validate: validateToolListResponse
    });
  }

  public async toolsInvoke(request: ToolInvokeRequest, options?: PhoenixRequestOptions): Promise<ToolInvokeResponse> {
    const payload = validateToolInvokeRequest(request);
    return this.transport.request<ToolInvokeResponse>({
      method: "POST",
      path: "/api/v1/tools/invoke",
      body: payload,
      options,
      validate: validateToolInvokeResponse
    });
  }

  public async realtimeNegotiate(
    request: RealtimeNegotiateRequest,
    options?: PhoenixRequestOptions
  ): Promise<RealtimeNegotiateResponse> {
    const payload = validateRealtimeNegotiateRequest(request);
    return this.transport.request<RealtimeNegotiateResponse>({
      method: "POST",
      path: "/api/v1/realtime/negotiate",
      body: payload,
      options,
      validate: validateRealtimeNegotiateResponse
    });
  }

  public async taskStatus(planId: string, options?: PhoenixRequestOptions): Promise<TaskStatusResponse> {
    return this.transport.request<TaskStatusResponse>({
      method: "GET",
      path: `/api/v1/task/${encodeURIComponent(planId)}`,
      options,
      validate: validateTaskStatusResponse
    });
  }

  public async waitForTaskReady(
    planId: string,
    waitOptions?: WaitForTaskReadyOptions
  ): Promise<TaskStatusResponse> {
    const legacy = this.legacyReadyByPlanId.get(planId);
    if (legacy) {
      return this.legacyBatchToStatus(legacy);
    }

    const timeoutMs = waitOptions?.timeoutMs ?? DEFAULT_WAIT_FOR_TASK_READY_TIMEOUT_MS;
    const realtimeWaitMs = Math.min(
      waitOptions?.realtimeWaitMs ?? DEFAULT_WAIT_FOR_TASK_READY_REALTIME_MS,
      timeoutMs
    );

    if (waitOptions?.realtimeEvents) {
      const sawPlanReady = await this.waitForPlanReadyEvent(planId, waitOptions.realtimeEvents, realtimeWaitMs);
      if (sawPlanReady) {
        const status = await this.taskStatus(planId, waitOptions.statusRequestOptions);
        if (status.proposed_action_batch) {
          return status;
        }
      }
    }

    return this.pollTaskStatusUntilReady(
      planId,
      timeoutMs,
      waitOptions?.pollIntervalMs ?? DEFAULT_WAIT_FOR_TASK_READY_POLL_INTERVAL_MS,
      waitOptions?.statusRequestOptions
    );
  }

  public async negotiateRealtimeAndWaitForTaskReady(
    options: RealtimeTaskReadyFlowOptions
  ): Promise<RealtimeTaskReadyFlowResult> {
    const negotiation = await this.realtimeNegotiate(
      {
        schema_version: "v1",
        session_id: options.sessionId,
        user_id: options.userId
      },
      options.negotiateRequestOptions
    );

    const realtimeEvents = createRealtimeEventStream({
      url: negotiation.url,
      accessToken: negotiation.access_token,
      transport: options.transport,
      signal: options.signal,
      webSocketFactory: options.webSocketFactory,
      eventSourceFactory: options.eventSourceFactory
    });

    try {
      const status = await this.waitForTaskReady(options.planId, {
        ...(options.waitForTaskReady ?? {}),
        realtimeEvents
      });

      return {
        negotiation,
        realtimeEvents,
        status
      };
    } catch (error) {
      realtimeEvents.close();
      throw error;
    }
  }

  public async locksList(options?: PhoenixRequestOptions): Promise<LocksListResponse> {
    return this.transport.request<LocksListResponse>({
      method: "GET",
      path: "/api/v1/locks",
      options,
      validate: validateLocksListResponse
    });
  }

  public async lockRelease(lockId: string, options?: PhoenixRequestOptions): Promise<LockReleaseResponse> {
    return this.transport.request<LockReleaseResponse>({
      method: "POST",
      path: `/api/v1/locks/${encodeURIComponent(lockId)}/release`,
      options,
      validate: validateLockReleaseResponse
    });
  }

  private isLegacyTaskResponseWindowOpen(): boolean {
    return Date.now() <= LEGACY_SYNC_TASK_RESPONSE_DEPRECATION_UNTIL_MS;
  }

  private legacyBatchToStatus(legacyBatch: ProposedActionBatch): TaskStatusResponse {
    return {
      schema_version: legacyBatch.schema_version,
      plan_id: legacyBatch.plan_id,
      job_id: `legacy-${legacyBatch.plan_id}`,
      session_id: legacyBatch.session_id,
      status: legacyBatch.requires_approval ? "awaiting_approval" : "done",
      tier: "legacy",
      updated_at: legacyBatch.proposed_at,
      proposed_action_batch: legacyBatch
    };
  }

  private async waitForPlanReadyEvent(
    planId: string,
    realtimeEvents: AsyncIterable<RealtimeServerEvent>,
    timeoutMs: number
  ): Promise<boolean> {
    const iterator = realtimeEvents[Symbol.asyncIterator]();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const remaining = deadline - Date.now();
      const nextEvent = await this.nextRealtimeEvent(iterator, remaining);

      if (!nextEvent || nextEvent.done) {
        return false;
      }

      if (nextEvent.value.event === "plan.ready" && nextEvent.value.plan_id === planId) {
        return true;
      }
    }

    return false;
  }

  private async pollTaskStatusUntilReady(
    planId: string,
    timeoutMs: number,
    pollIntervalMs: number,
    requestOptions?: PhoenixRequestOptions
  ): Promise<TaskStatusResponse> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() <= deadline) {
      try {
        const status = await this.taskStatus(planId, requestOptions);
        if (status.proposed_action_batch || status.status === "error") {
          return status;
        }
      } catch (error) {
        if (!(error instanceof PhoenixSdkError) || error.kind !== "http" || error.status !== 404) {
          throw error;
        }
      }

      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        break;
      }

      await this.delay(Math.min(pollIntervalMs, remaining), requestOptions?.signal);
    }

    throw new PhoenixSdkError({
      kind: "timeout",
      message: `Timed out waiting for task plan readiness for ${planId}`,
      retriable: false,
      details: { planId }
    });
  }

  private async nextRealtimeEvent(
    iterator: AsyncIterator<RealtimeServerEvent>,
    timeoutMs: number
  ): Promise<IteratorResult<RealtimeServerEvent> | null> {
    return new Promise(resolve => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(null);
      }, timeoutMs);

      iterator
        .next()
        .then(result => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timer);
          resolve(result);
        })
        .catch(() => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timer);
          resolve(null);
        });
    });
  }

  private async delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(
          new PhoenixSdkError({
            kind: "timeout",
            message: "waitForTaskReady was aborted",
            retriable: false
          })
        );
        return;
      }

      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, ms);

      const onAbort = () => {
        clearTimeout(timer);
        reject(
          new PhoenixSdkError({
            kind: "timeout",
            message: "waitForTaskReady was aborted",
            retriable: false
          })
        );
      };

      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
}
