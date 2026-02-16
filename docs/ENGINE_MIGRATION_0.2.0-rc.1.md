# Engine migration guide — 0.2.0-rc.1

This prerelease finalizes protocol parity for Interface ↔ Backend integration and adds typed gateway/realtime payload support.

## What changed

- `v1` fixtures now mirror backend canonical payloads.
- Core payload fields align with backend models (`event`, `idempotency_key`, `task_id`, `user_input`, `arguments`, etc.).
- Added additive typed schemas + fixtures under:
  - `contracts/v1/realtime`
  - `contracts/v1/gateway`
- Added typed SDK methods:
  - `realtimeNegotiate(request)`
  - `taskStatus(planId)`
  - `locksList()`
  - `lockRelease(lockId)`

## Field alignment highlights

- `session_start.request`
  - from: `project` / `snapshot`
  - to: `event`, `idempotency_key`, `sent_at`, `project_map`
- `delta_update.request`
  - from: `deltas[]`
  - to: `event`, `idempotency_key`, `scene`, `delta{...}`
- `task_request.request`
  - from: `user_request`, free-form `context`
  - to: `task_id`, `user_input`, `submitted_at`, `project_context`
- `task_request.response`
  - from: inline `ProposedActionBatch`
  - to: `task_queued_ack` + `plan_id`/`job_id`, then fetch actions through `GET /api/v1/task/{plan_id}`
- `tools_invoke.request`
  - from: `args`
  - to: `arguments`
- `auth_handshake.response`
  - from: `status`/`auth_mode`
  - to: `event`, `mode`, `actor_id`, `token_fingerprint`

## Engine integration checklist

- Update adapter serialization to canonical v1 request fields.
- Switch tool invoke payloads to `arguments`.
- Handle `409` HTTP conflicts as resync-required states.
- Use typed gateway methods for realtime bootstrap and lock/status polling fallback.
- Validate streaming event envelopes against realtime schemas before applying to UI state.

## Prerelease pinning

After tagging the repo:

- Git tag: `v0.2.0-rc.1`
- Pin from Engine: `npm install rivie13/Phoenix-Agentic-Engine-Interface#v0.2.0-rc.1`

If consuming via workspace path, pin by commit SHA in lockfile until the tag is pushed.
