
# PRIVATE — Architecture details (do NOT commit)

## Three-repo model

| Repo | Visibility | Role |
|------|------------|------|
| **Engine** (Godot fork) | Public | The Body — rendering, UI shell, local tool executors, adapter interfaces |
| **Interface** (this repo — TS SDK + contracts) | Public | The Nervous System — versioned API contracts, typed client, transport/retry, envelope validation |
| **Backend** (Python API on Azure) | Private | The Brain — multi-agent orchestration, prompt engineering, model routing, policy/risk, billing |

This repo is a **protocol layer**, not a UI product. It defines the contract between Engine and Backend. Both Engine and Backend depend on it.

## Interface repo scope

This repo **contains**:
- Versioned contract fixtures (`contracts/v1/`)
- Typed SDK client (`sdk/client/PhoenixClient.ts`, `sdk/client/types.ts`)
- Transport layer with retry/backoff (`sdk/transport/`)
- Request/response validators (`sdk/validators/`)
- Contract and compatibility tests (`tests/contract/`, `tests/compatibility/`)

This repo does **NOT** contain:
- UI components (those live in Engine)
- Command execution logic (Engine)
- System prompts or prompt templates (Backend)
- Orchestration logic or agent coordination (Backend)
- Model routing or selection intelligence (Backend)
- Approval policy rules or risk scoring (Backend)
- Usage metering or billing logic (Backend)

## The "Brain-Body" split (for context)

| Tier | Where | Visibility | Role |
|------|-------|------------|------|
| **Godot Fork + Plugins** | Engine repo (client) | Open source | The Body — rendering, UI shell, local tool executors, adapter interfaces |
| **Interface SDK** | This repo | Open source | The Nervous System — contracts, transport, validation |
| **Agent Orchestrator** | Backend repo (Azure) | Private | The Brain — multi-agent reasoning, prompt engineering, Git Worktree strategy |

### Golden Rule
> **If it makes us money or makes us unique, it lives in the backend. If it enables the community to contribute, it lives in the client or interface.**

## v1 contract surface

HTTP endpoints exposed via the SDK client:

1. `POST /api/v1/auth/handshake` → `AuthHandshakeResponse`
2. `GET  /api/v1/tools/list` → `ToolsListResponse`
3. `POST /api/v1/tools/invoke` → `ToolsInvokeResponse`
4. `POST /api/v1/session/start` → `SessionStartResponse`
5. `POST /api/v1/session/delta` → `DeltaUpdateResponse`
6. `POST /api/v1/task/request` → `TaskRequestResponse`
7. `POST /api/v1/task/{plan_id}/approval` → `ApprovalDecisionResponse`

## Data flow through this layer

1. **Engine** captures context (scene tree, user request, delta) → serializes using Interface types
2. **Interface SDK** validates envelope, adds auth/idempotency headers, sends HTTP request
3. **Backend** receives, processes, returns response
4. **Interface SDK** validates response envelope, handles retries/errors
5. **Engine** receives typed response, renders UI / executes commands

## Golden fixtures

- Backend repo owns **canonical** fixtures and golden tests (source of truth)
- This repo carries **published mirror** copies in `contracts/v1/`
- Compatibility tests in `tests/contract/` validate SDK against fixture mirror
- Fixture drift = breaking change — must be caught in CI

## Three operating modes (for context)

| Mode | Auth | Backend | Experience |
|------|------|---------|------------|
| **BYOK** | User's API key (routed through backend) | Limited orchestration | Free tier |
| **Managed** | Our API keys | Full orchestration + fine-tuned models | Paid tier |
| **Offline** | None | No backend connection | Intentionally limited |

The Interface SDK supports all three modes via the `authMode` config parameter.
