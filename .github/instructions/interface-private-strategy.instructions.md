
# PRIVATE — Interface strategy and boundaries (do NOT commit)

## What goes where — Interface perspective

When adding code to this repo, ask: "Is this protocol/contract/transport, or is it behavior/logic?"
- **Protocol/contract/transport** → belongs here.
- **UI behavior or command execution** → belongs in Engine.
- **Orchestration, prompts, or policy** → belongs in Backend.

### Examples

| Feature | Where |
|---------|-------|
| Request/response TypeScript types | **Interface** (this repo) |
| Zod validators for payloads | **Interface** (this repo) |
| HTTP client with retry/backoff | **Interface** (this repo) |
| Golden fixture JSON files | **Interface** (mirror from Backend) |
| Contract compatibility tests | **Interface** (this repo) |
| Chat panel rendering | **Engine** |
| Approval dialog UI | **Engine** |
| Command executor (create_file, modify_text) | **Engine** |
| System prompt templates | **Backend only** |
| Agent orchestration logic | **Backend only** |
| Model routing / provider selection | **Backend only** |
| Risk scoring / approval policies | **Backend only** |
| Billing / usage metering | **Backend only** |

## What is safe to publish (this repo is public)

**Safe — can be in this repo:**
- Endpoint surface and transport mechanics
- Versioned contracts (`v1`, `v2`, ...)
- Command schema and payload shapes
- Retry, idempotency, and conflict-handling rules
- Sanitized contract fixtures
- SDK client types and methods
- Error types and transport error handling

**Never publish — keep out of this repo:**
- Prompt templates or system prompts
- Agent routing/decomposition logic
- Risk scoring internals or escalation heuristics
- Provider/model routing strategy internals
- Billing/metering internals
- Credentials, API keys, or secrets

## Documentation map

Public docs in this repo:
- `docs/CLIENT_BACKEND_CONNECTION.md` — Three-repo ownership model, contract surface, runtime flow
- `docs/PUBLIC_CLIENT_BACKEND_CONNECTION.md` — Publish-safe version of connection docs
- `contracts/v1/README.md` — Contract fixture documentation

Private planning docs (local only — not committed):
- See Engine repo's `phoenix_docs_private/` for overall project architecture and roadmap.

## Dependency philosophy

This SDK must stay **lightweight**:
- `zod` — runtime validation (the only production dependency)
- `typescript` — compilation (dev)
- `vitest` — testing (dev)
- `cross-env` — cross-platform env vars for tests (dev)

Avoid adding dependencies unless absolutely necessary. Every new dependency is a supply chain risk for a public npm package.
