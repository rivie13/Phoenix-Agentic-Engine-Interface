# Phoenix Agentic Engine Interface (Protocol-Only)

Public interface repository for Phoenix engine/backend connectivity.

This repo contains only publish-safe protocol assets:

- versioned contracts/fixtures (`contracts/v1`)
- typed SDK client + transport (`sdk/client`, `sdk/transport`)
- schema validators (`sdk/validators`)
- contract/compatibility tests (`tests/contract`, `tests/compatibility`)

It intentionally excludes UI, orchestration, prompts, routing logic, policy logic, and command execution UX.

## Quickstart

1. Install dependencies:

  ```bash
  npm install
  ```

1. Run validation and compatibility tests:

  ```bash
  npm test
  ```

1. Optional smoke test against Azure App Service gateway:

  ```bash
  # Set once in .env.local (or use scripts/set-public-gateway-url.ps1)
  # PHOENIX_PUBLIC_GATEWAY_URL=https://<your-appservice-host>
  pwsh ./scripts/test-smoke.ps1
  ```

## Usage Example

```ts
import { PhoenixClient } from "./sdk/index.js";

const client = PhoenixClient.fromConfig({
 baseUrl: process.env.PHOENIX_PUBLIC_GATEWAY_URL ?? (() => { throw new Error("Set PHOENIX_PUBLIC_GATEWAY_URL"); })(),
 tokenProvider: () => process.env.PHOENIX_TOKEN ?? "",
 authMode: "managed"
});

const handshake = await client.authHandshake();
const tools = await client.toolsList();

const session = await client.sessionStart({
 schema_version: "v1",
 event: "session_start",
 session_id: "sess-001",
 idempotency_key: "idem-001",
 sent_at: new Date().toISOString(),
 project_map: {
  name: "my-project",
  godot_version: "4.3",
  main_scene: "res://main.tscn",
  scenes: {},
  scripts: [],
  resources: { audio: [], sprites: [], tilesets: [] },
  file_hash: "sha256:...",
  extras: {}
 }
});

const negotiate = await client.realtimeNegotiate({
 session_id: "sess-001",
 user_id: "user-123"
});

console.log(handshake.mode, tools.tools.length, session.accepted, negotiate.event);

const taskReady = await client.negotiateRealtimeAndWaitForTaskReady({
 sessionId: "sess-001",
 userId: "user-123",
 planId: "plan-001"
});

console.log(taskReady.status.status);
taskReady.realtimeEvents.close();
```

## Composed Engine Runtime

Use `EngineFrontendRuntime` when you want one runtime object that combines:

- `PhoenixClient` transport + typed methods
- session sync and automatic resync on HTTP `409` / realtime `session.resync_required`
- realtime negotiate/connect lifecycle

```ts
import { EngineFrontendRuntime, PhoenixClient } from "./sdk/index.js";

const client = PhoenixClient.fromConfig({
 baseUrl: process.env.PHOENIX_PUBLIC_GATEWAY_URL ?? (() => { throw new Error("Set PHOENIX_PUBLIC_GATEWAY_URL"); })(),
 tokenProvider: () => process.env.PHOENIX_TOKEN ?? "",
 authMode: "managed"
});

const runtime = new EngineFrontendRuntime({
 client,
 sessionId: "sess-001",
 userId: "user-123",
 snapshotProvider: async () => buildSessionSnapshot()
});

await runtime.startSession();
await runtime.connectRealtime();

await runtime.runRealtimeLoop(async (event) => {
 applyRealtimeEventToUi(event);
});

const readyStatus = await runtime.waitForTaskReady("plan-001");
console.log(readyStatus.status);
```

## Boundaries for Engine Consumers

- Engine repo must own approval UI and decision UX.
- Engine repo must own local command execution allowlist/runtime.
- Backend emits signed command/tool intents; engine-side capability repos execute local/runtime tool actions.
- Engine repo should use this SDK for transport, typing, retry behavior, and envelope validation.

See [docs/CLIENT_BACKEND_CONNECTION.md](docs/CLIENT_BACKEND_CONNECTION.md) for the three-repo ownership model.

## Engine Repo Next Checklist

- [x] Integrate contract-aligned engine adapter layer (direct C++ backend adapter path).
- [x] Implement approval UI for `ProposedActionBatch`.
- [x] Implement deterministic command executor allowlist for `CommandResponse`.
- [ ] Add engine-side UI + executor tests.
- [ ] Implement conflict (`409`) resync flow and delta sequencing UX.
- [ ] Consume typed realtime gateway methods: `realtimeNegotiate`, `taskStatus`, `locksList`, `lockRelease`.

Current architecture note: Engine runtime currently uses a direct C++ backend adapter aligned to Interface v1 contract shapes; full in-engine SDK embedding remains a future option if/when a native TS bridge/runtime is introduced.

See [docs/ENGINE_MIGRATION_0.2.0-rc.1.md](docs/ENGINE_MIGRATION_0.2.0-rc.1.md) for a concise upgrade guide.
