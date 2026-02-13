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
- Depends on interface SDK/contracts

### Interface Repo (Public)

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

1. `POST /api/v1/session/start`
2. `POST /api/v1/session/delta`
3. `POST /api/v1/task/request`
4. `POST /api/v1/task/{plan_id}/approval`

Core model flow:

- `SessionStartSnapshotRequest` -> `SessionStartAcceptedResponse`
- `DeltaUpdateRequest` -> `DeltaUpdateAcceptedResponse`
- `TaskRequest` -> `ProposedActionBatch`
- `ApprovalDecisionRequest` -> `CommandResponse`

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
- Backend returns `ProposedActionBatch` with approval requirement metadata

### Step D: Approval and execution

- **Engine UI** renders approval experience
- Engine submits approval decision via interface SDK
- Backend returns executable `CommandResponse`
- **Engine executor** runs allowed commands locally

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
    session_start.json
    delta_update.json
    task_request.json
    approval_decision.json
sdk/
  transport/
  client/
  validators/
tests/
  contract/
  compatibility/
```

### Engine Repo (Public)

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

## 11) Copy/Paste Starter Checklist

For interface repo:

- [ ] Copy this document
- [ ] Import published `v1` fixture mirror from backend release artifacts
- [ ] Implement typed HTTP client for the 4 `v1` endpoints
- [ ] Implement validators for request/response envelopes
- [ ] Add compatibility CI gates

For engine repo:

- [ ] Integrate interface SDK client
- [ ] Implement approval UI for `ProposedActionBatch`
- [ ] Implement command executor allowlist for `CommandResponse`
- [ ] Add UI/executor tests

For backend repo (private):

- [ ] Keep orchestration/prompt/policy internals private
- [ ] Keep public contracts backward compatible
- [ ] Maintain canonical fixtures and golden tests as the source of truth

---

## 12) Reusable Boundary Statements

### Interface Repo README Statement

> This repository provides the public protocol layer (contracts, transport SDK, validators, compatibility tests) between the engine client and private backend. It intentionally excludes UI and orchestration logic.

