import { describe, expect, it } from "vitest";
import { createRealtimeEventStream } from "../../sdk/transport/realtimeEventStream.js";

class FakeRealtimeSocket {
	private readonly listeners = new Map<string, Set<(event: unknown) => void>>();

	public addEventListener(type: string, listener: (event: unknown) => void): void {
		const set = this.listeners.get(type) ?? new Set<(event: unknown) => void>();
		set.add(listener);
		this.listeners.set(type, set);
	}

	public removeEventListener(type: string, listener: (event: unknown) => void): void {
		this.listeners.get(type)?.delete(listener);
	}

	public close(): void {
		this.emit("close", { code: 1000 });
	}

	public emit(type: string, event: unknown): void {
		for (const listener of this.listeners.get(type) ?? []) {
			listener(event);
		}
	}
}

class FakeRealtimeEventSource {
	private readonly listeners = new Map<string, Set<(event: unknown) => void>>();

	public addEventListener(type: string, listener: (event: unknown) => void): void {
		const set = this.listeners.get(type) ?? new Set<(event: unknown) => void>();
		set.add(listener);
		this.listeners.set(type, set);
	}

	public removeEventListener(type: string, listener: (event: unknown) => void): void {
		this.listeners.get(type)?.delete(listener);
	}

	public close(): void {
		this.emit("closed", { closed: true });
	}

	public emit(type: string, event: unknown): void {
		for (const listener of this.listeners.get(type) ?? []) {
			listener(event);
		}
	}
}

describe("Realtime event stream adapter", () => {
	it("streams validated websocket events and appends access token", async () => {
		const socket = new FakeRealtimeSocket();
		let connectedUrl = "";

		const stream = createRealtimeEventStream({
			url: "wss://example.test/client/hubs/phoenix",
			accessToken: "token-123",
			transport: "websocket",
			webSocketFactory: (url) => {
				connectedUrl = url;
				return socket;
			}
		});

		const iterator = stream[Symbol.asyncIterator]();
		const nextEvent = iterator.next();

		socket.emit("message", {
			data: JSON.stringify({
				schema_version: "v1",
				event: "plan.ready",
				plan_id: "plan-001",
				action_count: 2,
				requires_approval: true
			})
		});

		await expect(nextEvent).resolves.toMatchObject({
			done: false,
			value: {
				event: "plan.ready",
				plan_id: "plan-001"
			}
		});

		expect(connectedUrl).toContain("access_token=token-123");

		stream.close();
		const done = await iterator.next();
		expect(done.done).toBe(true);
	});

	it("unwraps websocket envelope payloads", async () => {
		const socket = new FakeRealtimeSocket();

		const stream = createRealtimeEventStream({
			url: "wss://example.test/client/hubs/phoenix",
			transport: "websocket",
			webSocketFactory: () => socket
		});

		const iterator = stream[Symbol.asyncIterator]();
		const nextEvent = iterator.next();

		socket.emit("message", {
			data: JSON.stringify({
				type: "message",
				data: JSON.stringify({
					schema_version: "v1",
					event: "job.queued",
					job_id: "job-001",
					plan_id: "plan-001",
					tier: "free"
				})
			})
		});

		await expect(nextEvent).resolves.toMatchObject({
			done: false,
			value: {
				event: "job.queued",
				job_id: "job-001"
			}
		});

		stream.close();
	});

	it("returns typed errors for invalid websocket payloads", async () => {
		const socket = new FakeRealtimeSocket();

		const stream = createRealtimeEventStream({
			url: "wss://example.test/client/hubs/phoenix",
			transport: "websocket",
			webSocketFactory: () => socket
		});

		const iterator = stream[Symbol.asyncIterator]();
		const nextEvent = iterator.next();

		socket.emit("message", {
			data: JSON.stringify({
				event: "unknown.event"
			})
		});

		await expect(nextEvent).rejects.toMatchObject({
			name: "PhoenixSdkError",
			kind: "validation"
		});
	});

	it("supports SSE mode via eventSourceFactory", async () => {
		const source = new FakeRealtimeEventSource();

		const stream = createRealtimeEventStream({
			url: "https://example.test/realtime",
			transport: "sse",
			eventSourceFactory: () => source
		});

		const iterator = stream[Symbol.asyncIterator]();
		const nextEvent = iterator.next();

		source.emit("message", {
			data: JSON.stringify({
				schema_version: "v1",
				event: "session.resync_required",
				session_id: "sess-001",
				reason: "reconnect",
				last_confirmed_seq: 7
			})
		});

		await expect(nextEvent).resolves.toMatchObject({
			done: false,
			value: {
				event: "session.resync_required",
				session_id: "sess-001"
			}
		});

		stream.close();
	});
});