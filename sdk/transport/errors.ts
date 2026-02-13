export type PhoenixErrorKind = "http" | "timeout" | "network" | "validation";

export interface PhoenixSdkErrorOptions {
  kind: PhoenixErrorKind;
  message: string;
  status?: number;
  code?: string;
  retriable?: boolean;
  correlationId?: string;
  details?: unknown;
}

export class PhoenixSdkError extends Error {
  public readonly kind: PhoenixErrorKind;
  public readonly status?: number;
  public readonly code?: string;
  public readonly retriable: boolean;
  public readonly correlationId?: string;
  public readonly details?: unknown;

  public constructor(options: PhoenixSdkErrorOptions) {
    super(options.message);
    this.name = "PhoenixSdkError";
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
    this.retriable = options.retriable ?? false;
    this.correlationId = options.correlationId;
    this.details = options.details;
  }
}
