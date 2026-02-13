export type TokenProvider = string | (() => string | Promise<string>);

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
}

export interface PhoenixTransportConfig {
  baseUrl: string;
  tokenProvider?: TokenProvider;
  authMode?: string;
  defaultHeaders?: Record<string, string>;
  correlationHeaderKeys?: string[];
  retry?: Partial<RetryConfig>;
  fetchImpl?: typeof fetch;
}

export interface PhoenixRequestOptions {
  headers?: Record<string, string>;
  correlationHeaders?: Record<string, string>;
  idempotencyKey?: string;
  timeoutMs?: number;
  retry?: Partial<RetryConfig>;
  signal?: AbortSignal;
}

export interface RequestArgs<TBody = unknown> {
  method: "GET" | "POST";
  path: string;
  body?: TBody;
  options?: PhoenixRequestOptions;
  validate?: (payload: unknown) => unknown;
}
