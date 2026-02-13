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

2. Run validation and compatibility tests:

	 ```bash
	 npm test
	 ```

3. Optional local smoke test against `http://127.0.0.1:8000`:

	 ```bash
	 npm run test:smoke
	 ```

## Usage Example

```ts
import { PhoenixClient } from "./sdk/index.js";

const client = PhoenixClient.fromConfig({
	baseUrl: "http://127.0.0.1:8000",
	tokenProvider: () => process.env.PHOENIX_TOKEN ?? "",
	authMode: "managed"
});

const handshake = await client.authHandshake();
const tools = await client.toolsList();

const session = await client.sessionStart({
	schema_version: "v1",
	session_id: "sess_001",
	project: { name: "my-project" },
	snapshot: {
		captured_at: new Date().toISOString(),
		files: [{ path: "README.md", hash: "sha256:..." }]
	}
});

console.log(handshake.status, tools.tools.length, session.accepted);
```

## Boundaries for Engine Consumers

- Engine repo must own approval UI and decision UX.
- Engine repo must own local command execution allowlist/runtime.
- Engine repo should use this SDK for transport, typing, retry behavior, and envelope validation.

See [docs/CLIENT_BACKEND_CONNECTION.md](docs/CLIENT_BACKEND_CONNECTION.md) for the three-repo ownership model.

## Engine Repo Next Checklist

- [ ] Integrate this SDK into engine runtime adapter layer.
- [ ] Implement approval UI for `ProposedActionBatch`.
- [ ] Implement deterministic command executor allowlist for `CommandResponse`.
- [ ] Add engine-side UI + executor tests.
- [ ] Implement conflict (`409`) resync flow and delta sequencing UX.
