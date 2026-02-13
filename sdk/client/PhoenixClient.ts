import {
  validateApprovalDecisionRequest,
  validateAuthHandshakeResponse,
  validateCommandResponse,
  validateDeltaUpdateAcceptedResponse,
  validateDeltaUpdateRequest,
  validateProposedActionBatch,
  validateSessionStartAcceptedResponse,
  validateSessionStartSnapshotRequest,
  validateTaskRequest,
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
  ProposedActionBatch,
  SessionStartAcceptedResponse,
  SessionStartSnapshotRequest,
  TaskRequest,
  ToolInvokeRequest,
  ToolInvokeResponse,
  ToolListResponse
} from "../validators/schemas.js";
import { PhoenixTransport } from "../transport/phoenixTransport.js";
import type { PhoenixRequestOptions, PhoenixTransportConfig } from "../transport/types.js";

export class PhoenixClient {
  private readonly transport: PhoenixTransport;

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

  public async taskRequest(request: TaskRequest, options?: PhoenixRequestOptions): Promise<ProposedActionBatch> {
    const payload = validateTaskRequest(request);
    return this.transport.request<ProposedActionBatch>({
      method: "POST",
      path: "/api/v1/task/request",
      body: payload,
      options,
      validate: validateProposedActionBatch
    });
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
}
