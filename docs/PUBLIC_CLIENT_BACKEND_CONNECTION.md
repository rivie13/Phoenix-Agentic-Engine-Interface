# Three-Repo Connection Model (Public Copy-Ready)

This document is designed to be copied into a **public interface repository**.

It defines only publish-safe material: contracts, transport behavior, validation rules, and cross-repo ownership.

This repository is the public protocol layer between the engine client and private backend. It intentionally excludes UI and orchestration logic, which remain in the engine and backend repos respectively.

---

## 1) Repository Topology (Required)

Phoenix is implemented as three repositories with strict boundaries:

1. **Engine Repo (Public)**
   - Godot fork/plugin runtime
   - UI/UX (chat, approvals, previews, settings)
   - Local command execution against editor APIs
2. **Interface Repo (Public)**
   - Versioned API contracts and fixtures
   - SDK/client transport and validation logic
   - Shared protocol helpers used by engine and backend tests
3. **Backend Repo (Private)**
   - Orchestration, prompts, policy/risk, model routing
   - Security pipelines and business logic

The interface repo is a protocol layer, **not** a UI product.

---

## 2) Ownership Matrix

### Engine Repo (Public)

- Owns approval dialogs and user decisions
- Owns command executor and local tool execution
- Owns scene snapshot and delta capture
- Owns runtime/tool execution surfaces in frontend capability repos (`godot-mcp`, `godot-ai-autonomous-agent`, `godot-mcp-docs`, `godot-copilot`)
- Depends on interface SDK/contracts

### Interface Repo Layout (Public)

- Owns request/response schemas and contract versioning
- Owns typed client, retry/idempotency behavior, and envelope validation
- Owns published fixture mirror and SDK compatibility checks
- Does **not** own approval UI
- Does **not** own orchestration logic

### Backend Repo (Private)

- Owns planning/orchestration and prompt construction
- Owns policy/risk decisions and approval requirements
- Owns sanitization/redaction and model/provider routing
- Owns canonical contract fixtures and authoritative contract (golden) tests
- Emits signed command/tool-intent payloads; does not execute engine-local tooling directly

---

## 3) What Is Safe to Publish

Safe in public repos (engine/interface):

- Endpoint surface and transport mechanics
- Versioned contracts (`v1`, `v2`, ...)
- Command schema and deterministic executor behavior
- Retry, idempotency, and conflict-handling rules
- Sanitized contract fixtures

Never publish from private backend internals:

- Prompt templates/system prompts
- Agent routing/decomposition logic
- Risk scoring internals or escalation heuristics
- Provider/model routing strategy internals
- Billing/metering internals

---

## 4) v1 Contract Surface

HTTP endpoints:

1. `POST /api/v1/auth/handshake`
2. `GET /api/v1/tools`
3. `POST /api/v1/tools/invoke`
4. `POST /api/v1/session/start`
5. `POST /api/v1/session/delta`
6. `POST /api/v1/task/request`
7. `POST /api/v1/task/{plan_id}/approval`
8. `POST /api/v1/realtime/negotiate`
9. `GET /api/v1/task/{plan_id}`
10. `GET /api/v1/locks`
11. `POST /api/v1/locks/{lock_id}/release`

Core model flow:

- `AuthHandshakeResponse` and `ToolListResponse` provide auth/tooling capability bootstrap
- `SessionStartSnapshotRequest` -> `SessionStartAcceptedResponse`
- `DeltaUpdateRequest` -> `DeltaUpdateAcceptedResponse`
- `TaskRequest` -> `TaskRequestAcceptedResponse` (`202 Accepted`, `task_queued_ack`)
- `RealtimeNegotiateRequest` -> `RealtimeNegotiateResponse` for realtime channel bootstrap
- `GET /api/v1/task/{plan_id}` -> `TaskStatusResponse` (polling fallback for `ProposedActionBatch`)
- `ApprovalDecisionRequest` -> `CommandResponse`
- `GET /api/v1/locks` -> `LocksListResponse` and `POST /api/v1/locks/{lock_id}/release` -> `LockReleaseResponse`

Contract rules:

- Every top-level payload includes `schema_version`
- Engine pins explicit version
- Breaking changes require new version namespace

---

## 5) Runtime Flow by Repo

### Step A: Session bootstrap

- Engine captures initial project snapshot
- Engine uses interface SDK to call `session/start`
- Backend returns session ack

### Step B: Ongoing sync

- Engine emits monotonic scene deltas
- Interface SDK enforces schema + idempotency headers/fields
- Backend acks accepted sequence

### Step C: Task planning

- Engine sends user request/mode
- Backend returns queued ack (`task_queued_ack`) immediately
- Proposed plan arrives asynchronously via realtime `plan.ready` and is retrievable via `GET /api/v1/task/{plan_id}`

### Step D: Approval and execution

- **Engine UI** renders approval experience
- Engine submits approval decision via interface SDK
- Backend returns executable/signed `CommandResponse` (command intent payload)
- **Engine executor** runs allowed commands locally (including frontend capability repo runtime/tool actions)

---

## 6) Command Contract and Execution Location

Supported v1 actions:

- `create_file`
- `modify_text`
- `create_node`
- `chat_message`

Execution ownership:

- Schema/type validation helpers can live in interface repo
- Actual command execution lives in engine repo

Engine executor requirements:

1. Strict action allowlist
2. Payload shape validation before execution
3. Reject unknown actions
4. Deterministic execution + structured result logging
5. No arbitrary code execution path

---

## 7) Transport and Auth Boundary

Transport:

- HTTPS for control plane
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

Auth split:

- Engine owns sign-in/user session UX
- Interface SDK owns token wiring/refresh hooks in requests
- Backend owns token validation/authorization policies

Mode behavior:

- BYOK: engine captures user credential, backend still orchestrates
- Managed: backend-issued session/JWT, backend handles provider keys

---

## 8) Reliability and Conflict Rules

- Require `idempotency_key` on retry-sensitive writes
- Enforce in-order `sequence` for deltas
- Retry transient failures with bounded backoff
- Do not auto-retry validation (`4xx`) errors
- Surface `409` conflicts in engine and trigger resync workflow

---

## 9) Golden Fixtures (Terminology + Ownership)

`Golden fixtures` are locked example request/response payloads used as compatibility baselines.

Purpose:

- Detect accidental contract drift
- Keep SDK behavior stable across releases
- Make breaking changes explicit (`v2` instead of silent `v1` mutation)

Ownership model:

- **Backend repo (canonical source):** owns master fixtures and authoritative golden tests
- **Interface repo (published mirror):** carries exported fixture copies for SDK/validator compatibility tests
- **Engine repo:** typically consumes SDK and runs conformance tests; it does not need to be the fixture source of truth

Recommended flow:

1. Update contract models in backend
2. Update canonical fixtures in backend and pass backend golden tests
3. Export/version fixture set to interface repo
4. Run interface compatibility CI against the exported fixture set

---

## 10) Suggested Repo Layouts

### Interface Repo (Public)

```text
docs/
  CLIENT_BACKEND_CONNECTION.md
contracts/
  v1/
    session_start.request.json
    session_start.response.json
    delta_update.request.json
    delta_update.response.json
    task_request.request.json
    task_request.response.json
    approval_decision.request.json
    approval_decision.response.json
    auth_handshake.response.json
    tools_list.response.json
    tools_invoke.request.json
    tools_invoke.response.json
    gateway/
    realtime/
sdk/
  transport/
  client/
  validators/
tests/
  contract/
  compatibility/
```

### Engine Repo Layout (Public)

```text
modules/.../ui/
  approval_gate/
  assistant_panel/
modules/.../runtime/
  command_executor/
  session_sync/
modules/.../integration/
  interface_sdk_adapter/
tests/
  ui/
  executor/
```

---

## 11) Interface Status Checklist (0.2.0-rc.1)

For interface repo:

- [x] Publish `v1` fixture mirror (core + gateway + realtime payloads)
- [x] Implement typed SDK client endpoints for auth/tools/session/task/gateway
- [x] Implement request/response validators and realtime event envelope validators
- [x] Add compatibility CI gates
- [x] Add SDK-managed WS/SSE realtime transport adapter
- [ ] Add `v2` namespace when first breaking contract change is required

For engine repo:

- [x] Integrate contract-aligned engine adapter (direct C++ backend adapter path)
- [x] Implement approval UI for `ProposedActionBatch`
- [x] Implement command executor allowlist for `CommandResponse`
- [ ] Add UI/executor tests

Current architecture note: the engine runtime currently uses a direct C++ backend adapter aligned to Interface v1 contracts; a full in-engine Interface SDK embedding remains a future option if a native TS bridge/runtime is introduced.

For backend repo (private):

- [ ] Keep orchestration/prompt/policy internals private
- [ ] Keep public contracts backward compatible
- [ ] Maintain canonical fixtures and golden tests as the source of truth

---

## 12) Reusable Boundary Statements

### Interface Repo README Statement

> This repository provides the public protocol layer (contracts, transport SDK, validators, compatibility tests) between the engine client and private backend. It intentionally excludes UI and orchestration logic.

