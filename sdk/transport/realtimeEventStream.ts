import { validateRealtimeServerEvent } from "../validators/index.js";
import type { RealtimeServerEvent } from "../validators/schemas.js";
import { PhoenixSdkError } from "./errors.js";

export type RealtimeTransportKind = "auto" | "websocket" | "sse";

export interface RealtimeWebSocketLike {
	addEventListener(type: string, listener: (event: unknown) => void): void;
	removeEventListener(type: string, listener: (event: unknown) => void): void;
	close(code?: number, reason?: string): void;
}

export interface RealtimeEventSourceLike {
	addEventListener(type: string, listener: (event: unknown) => void): void;
	removeEventListener(type: string, listener: (event: unknown) => void): void;
	close(): void;
}

export interface RealtimeEventStreamOptions {
	readonly url: string;
	readonly accessToken?: string;
	readonly transport?: RealtimeTransportKind;
	readonly signal?: AbortSignal;
	readonly webSocketFactory?: (url: string) => RealtimeWebSocketLike;
	readonly eventSourceFactory?: (url: string) => RealtimeEventSourceLike;
}

export interface RealtimeEventStream extends AsyncIterable<RealtimeServerEvent> {
	close(): void;
}

interface QueueWaiter<T> {
	readonly resolve: (value: IteratorResult<T>) => void;
	readonly reject: (reason?: unknown) => void;
}

interface RealtimeGlobalConstructors {
	readonly WebSocket?: new (url: string) => RealtimeWebSocketLike;
	readonly EventSource?: new (url: string) => RealtimeEventSourceLike;
}

class AsyncIteratorQueue<T> {
	private readonly items: T[] = [];
	private readonly waiters: QueueWaiter<T>[] = [];
	private done = false;
	private failure: unknown;

	public push(item: T): void {
		if (this.done || this.failure !== undefined) {
			return;
		}

		const waiter = this.waiters.shift();
		if (waiter) {
			waiter.resolve({ done: false, value: item });
			return;
		}

		this.items.push(item);
	}

	public close(): void {
		if (this.done) {
			return;
		}

		this.done = true;
		while (this.waiters.length > 0) {
			const waiter = this.waiters.shift();
			waiter?.resolve({ done: true, value: undefined });
		}
	}

	public fail(error: unknown): void {
		if (this.done || this.failure !== undefined) {
			return;
		}

		this.failure = error;
		while (this.waiters.length > 0) {
			const waiter = this.waiters.shift();
			waiter?.reject(error);
		}
	}

	public next(): Promise<IteratorResult<T>> {
		if (this.items.length > 0) {
			const value = this.items.shift() as T;
			return Promise.resolve({ done: false, value });
		}

		if (this.failure !== undefined) {
			return Promise.reject(this.failure);
		}

		if (this.done) {
			return Promise.resolve({ done: true, value: undefined });
		}

		return new Promise((resolve, reject) => {
			this.waiters.push({ resolve, reject });
		});
	}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const parseJsonMaybe = (value: unknown): unknown => {
	if (typeof value !== "string") {
		return value;
	}

	const trimmed = value.trim();
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
		return value;
	}

	try {
		return JSON.parse(trimmed);
	} catch {
		return value;
	}
};

const isValidatedRealtimeEvent = (value: unknown): value is RealtimeServerEvent =>
	isRecord(value) && typeof value.schema_version === "string" && typeof value.event === "string";

const unwrapRealtimePayload = (value: unknown): unknown => {
	let current: unknown = parseJsonMaybe(value);

	for (let depth = 0; depth < 4; depth += 1) {
		if (isValidatedRealtimeEvent(current)) {
			return current;
		}

		if (!isRecord(current)) {
			return current;
		}

		if ("data" in current) {
			current = parseJsonMaybe(current.data);
			continue;
		}

		if ("message" in current) {
			current = parseJsonMaybe(current.message);
			continue;
		}

		return current;
	}

	return current;
};

const buildRealtimeUrl = (url: string, accessToken?: string): string => {
	if (!accessToken) {
		return url;
	}

	try {
		const parsed = new URL(url);
		parsed.searchParams.set("access_token", accessToken);
		return parsed.toString();
	} catch {
		const separator = url.includes("?") ? "&" : "?";
		return `${url}${separator}access_token=${encodeURIComponent(accessToken)}`;
	}
};

const resolveTransportKind = (options: RealtimeEventStreamOptions): RealtimeTransportKind => {
	const requested = options.transport ?? "auto";
	if (requested !== "auto") {
		return requested;
	}

	const globals = globalThis as RealtimeGlobalConstructors;
	if (options.webSocketFactory || globals.WebSocket) {
		return "websocket";
	}

	if (options.eventSourceFactory || globals.EventSource) {
		return "sse";
	}

	throw new PhoenixSdkError({
		kind: "network",
		message: "No realtime transport is available; provide webSocketFactory or eventSourceFactory",
		retriable: false
	});
};

const createWebSocket = (options: RealtimeEventStreamOptions, streamUrl: string): RealtimeWebSocketLike => {
	if (options.webSocketFactory) {
		return options.webSocketFactory(streamUrl);
	}

	const globals = globalThis as RealtimeGlobalConstructors;
	if (!globals.WebSocket) {
		throw new PhoenixSdkError({
			kind: "network",
			message: "WebSocket is not available in this runtime; provide webSocketFactory",
			retriable: false
		});
	}

	return new globals.WebSocket(streamUrl);
};

const createEventSource = (options: RealtimeEventStreamOptions, streamUrl: string): RealtimeEventSourceLike => {
	if (options.eventSourceFactory) {
		return options.eventSourceFactory(streamUrl);
	}

	const globals = globalThis as RealtimeGlobalConstructors;
	if (!globals.EventSource) {
		throw new PhoenixSdkError({
			kind: "network",
			message: "EventSource is not available in this runtime; provide eventSourceFactory",
			retriable: false
		});
	}

	return new globals.EventSource(streamUrl);
};

const toValidationError = (error: unknown): PhoenixSdkError => {
	if (error instanceof PhoenixSdkError) {
		return error;
	}

	return new PhoenixSdkError({
		kind: "validation",
		message: "Realtime event payload failed validation",
		retriable: false,
		details: error
	});
};

export const createRealtimeEventStream = (options: RealtimeEventStreamOptions): RealtimeEventStream => {
	const queue = new AsyncIteratorQueue<RealtimeServerEvent>();
	const streamUrl = buildRealtimeUrl(options.url, options.accessToken);
	const transport = resolveTransportKind(options);

	let closed = false;
	let cleanup = (): void => undefined;

	const close = (): void => {
		if (closed) {
			return;
		}

		closed = true;
		cleanup();
		queue.close();
	};

	const fail = (error: unknown): void => {
		if (closed) {
			return;
		}

		closed = true;
		cleanup();
		queue.fail(error);
	};

	if (transport === "websocket") {
		const webSocket = createWebSocket(options, streamUrl);

		const onMessage = (event: unknown): void => {
			try {
				const rawData = isRecord(event) && "data" in event ? event.data : event;
				const payload = unwrapRealtimePayload(rawData);
				queue.push(validateRealtimeServerEvent(payload));
			} catch (error) {
				fail(toValidationError(error));
			}
		};

		const onError = (event: unknown): void => {
			fail(
				new PhoenixSdkError({
					kind: "network",
					message: "Realtime websocket error",
					retriable: true,
					details: event
				})
			);
		};

		const onClose = (event: unknown): void => {
			if (isRecord(event) && typeof event.code === "number" && event.code !== 1000) {
				fail(
					new PhoenixSdkError({
						kind: "network",
						message: `Realtime websocket closed with code ${event.code}`,
						retriable: true,
						details: event
					})
				);
				return;
			}

			close();
		};

		webSocket.addEventListener("message", onMessage);
		webSocket.addEventListener("error", onError);
		webSocket.addEventListener("close", onClose);

		cleanup = (): void => {
			webSocket.removeEventListener("message", onMessage);
			webSocket.removeEventListener("error", onError);
			webSocket.removeEventListener("close", onClose);
			try {
				webSocket.close(1000, "client_closed");
			} catch {
				// noop
			}
		};
	} else {
		const eventSource = createEventSource(options, streamUrl);

		const onMessage = (event: unknown): void => {
			try {
				const rawData = isRecord(event) && "data" in event ? event.data : event;
				const payload = unwrapRealtimePayload(rawData);
				queue.push(validateRealtimeServerEvent(payload));
			} catch (error) {
				fail(toValidationError(error));
			}
		};

		const onError = (event: unknown): void => {
			fail(
				new PhoenixSdkError({
					kind: "network",
					message: "Realtime event stream error",
					retriable: true,
					details: event
				})
			);
		};

		eventSource.addEventListener("message", onMessage);
		eventSource.addEventListener("error", onError);

		cleanup = (): void => {
			eventSource.removeEventListener("message", onMessage);
			eventSource.removeEventListener("error", onError);
			eventSource.close();
		};
	}

	if (options.signal) {
		if (options.signal.aborted) {
			close();
		} else {
			const onAbort = (): void => {
				close();
			};

			const previousCleanup = cleanup;
			options.signal.addEventListener("abort", onAbort, { once: true });
			cleanup = (): void => {
				options.signal?.removeEventListener("abort", onAbort);
				previousCleanup();
			};
		}
	}

	const iterator: AsyncIterator<RealtimeServerEvent> = {
		next: (): Promise<IteratorResult<RealtimeServerEvent>> => queue.next(),
		return: async (): Promise<IteratorResult<RealtimeServerEvent>> => {
			close();
			return { done: true, value: undefined };
		}
	};

	return {
		close,
		[Symbol.asyncIterator](): AsyncIterator<RealtimeServerEvent> {
			return iterator;
		}
	};
};