import type { RetryConfig } from "./types.js";

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 200,
  maxDelayMs: 1200,
  timeoutMs: 8000
};

export const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const nextBackoffMs = (attempt: number, config: RetryConfig): number => {
  const exponential = config.baseDelayMs * Math.pow(2, attempt);
  const bounded = Math.min(config.maxDelayMs, exponential);
  const jitter = Math.floor(Math.random() * 40);
  return bounded + jitter;
};
