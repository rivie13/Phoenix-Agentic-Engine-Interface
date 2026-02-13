import { ZodError } from "zod";
import { nextBackoffMs, wait, DEFAULT_RETRY_CONFIG } from "./backoff.js";
import { PhoenixSdkError } from "./errors.js";
import type { PhoenixTransportConfig, RequestArgs, RetryConfig, TokenProvider } from "./types.js";

const TRANSIENT_STATUS_CODES = new Set([500, 502, 503, 504]);
const DEFAULT_CORRELATION_HEADERS = ["x-correlation-id", "x-request-id", "traceparent"];

const resolveToken = async (tokenProvider?: TokenProvider): Promise<string | undefined> => {
  if (!tokenProvider) {
    return undefined;
  }

  if (typeof tokenProvider === "string") {
    return tokenProvider;
  }

  return tokenProvider();
};

const normalizeUrl = (baseUrl: string, path: string): string => {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = path.replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedPath}`;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const isAbortTimeoutError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

export class PhoenixTransport {
  private readonly config: PhoenixTransportConfig;
  private readonly fetchImpl: typeof fetch;

  public constructor(config: PhoenixTransportConfig) {
    this.config = {
      ...config,
      correlationHeaderKeys: config.correlationHeaderKeys ?? DEFAULT_CORRELATION_HEADERS
    };
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  public async request<TResponse>(args: RequestArgs): Promise<TResponse> {
    const retryConfig = this.resolveRetryConfig(args.options?.retry, args.options?.timeoutMs);
    const url = normalizeUrl(this.config.baseUrl, args.path);

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt += 1) {
      try {
        const response = await this.execute(url, args, retryConfig.timeoutMs);

        if (!response.ok) {
          const body = await parseResponseBody(response);
          const correlationId = this.extractCorrelationId(response.headers);
          const retriable = TRANSIENT_STATUS_CODES.has(response.status);

          const error = new PhoenixSdkError({
            kind: "http",
            message: `HTTP ${response.status} for ${args.method} ${args.path}`,
            status: response.status,
            retriable,
            correlationId,
            details: body
          });

          if (retriable && attempt < retryConfig.maxRetries) {
            await wait(nextBackoffMs(attempt, retryConfig));
            continue;
          }

          throw error;
        }

        const payload = await parseResponseBody(response);

        if (!args.validate) {
          return payload as TResponse;
        }

        try {
          return args.validate(payload) as TResponse;
        } catch (error) {
          if (error instanceof ZodError) {
            throw new PhoenixSdkError({
              kind: "validation",
              message: `Response validation failed for ${args.method} ${args.path}`,
              retriable: false,
              details: error.flatten()
            });
          }

          throw error;
        }
      } catch (error) {
        if (error instanceof PhoenixSdkError) {
          throw error;
        }

        const timeoutError = isAbortTimeoutError(error);
        const retriable = timeoutError;

        if (retriable && attempt < retryConfig.maxRetries) {
          await wait(nextBackoffMs(attempt, retryConfig));
          continue;
        }

        throw new PhoenixSdkError({
          kind: timeoutError ? "timeout" : "network",
          message: timeoutError
            ? `Request timeout for ${args.method} ${args.path}`
            : `Network error for ${args.method} ${args.path}`,
          retriable,
          details: error
        });
      }
    }

    throw new PhoenixSdkError({
      kind: "network",
      message: `Exhausted retries for ${args.method} ${args.path}`,
      retriable: false
    });
  }

  private async execute(url: string, args: RequestArgs, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = await this.buildHeaders(args);

      return await this.fetchImpl(url, {
        method: args.method,
        headers,
        body: args.body === undefined ? undefined : JSON.stringify(args.body),
        signal: args.options?.signal ?? controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async buildHeaders(args: RequestArgs): Promise<Headers> {
    const headers = new Headers({
      "Content-Type": "application/json",
      ...(this.config.defaultHeaders ?? {}),
      ...(args.options?.headers ?? {})
    });

    const token = await resolveToken(this.config.tokenProvider);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (this.config.authMode) {
      headers.set("x-phoenix-auth-mode", this.config.authMode);
    }

    if (args.options?.idempotencyKey) {
      headers.set("idempotency_key", args.options.idempotencyKey);
    }

    if (args.options?.correlationHeaders) {
      for (const key of this.config.correlationHeaderKeys ?? DEFAULT_CORRELATION_HEADERS) {
        const value = args.options.correlationHeaders[key];
        if (value) {
          headers.set(key, value);
        }
      }
    }

    return headers;
  }

  private resolveRetryConfig(override?: Partial<RetryConfig>, timeoutMs?: number): RetryConfig {
    return {
      ...DEFAULT_RETRY_CONFIG,
      ...(this.config.retry ?? {}),
      ...(override ?? {}),
      timeoutMs: timeoutMs ?? override?.timeoutMs ?? this.config.retry?.timeoutMs ?? DEFAULT_RETRY_CONFIG.timeoutMs
    };
  }

  private extractCorrelationId(headers: Headers): string | undefined {
    const keys = this.config.correlationHeaderKeys ?? DEFAULT_CORRELATION_HEADERS;
    for (const key of keys) {
      const value = headers.get(key);
      if (value) {
        return value;
      }
    }

    return undefined;
  }
}
