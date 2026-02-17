---
name: contract-sync
description: Synchronize API contracts and golden fixtures between Backend and Interface repos. Use when user asks to sync contracts, update fixtures, check contract compatibility, fix schema drift, or align API schemas between repos.
---

# Contract Sync — Phoenix Agentic Engine Interface

## Context

The Interface repo carries **published fixture mirrors** of the Backend's canonical schemas. The chain is:

```
Backend (owns gateway contract behavior + backend fixture mirror) → Interface (mirrors as golden fixtures + typed SDK) → Engine (consumes)
```

## Interface fixture locations

All golden fixtures live in `contracts/v1/`:

| Fixture file | Maps to backend endpoint |
|-------------|--------------------------|
| `session_start.request.json` | `POST /api/v1/session/start` request |
| `session_start.response.json` | `POST /api/v1/session/start` response |
| `delta_update.request.json` | `POST /api/v1/session/delta` request |
| `delta_update.response.json` | `POST /api/v1/session/delta` response |
| `task_request.request.json` | `POST /api/v1/task/request` request |
| `task_request.response.json` | `POST /api/v1/task/request` response |
| `approval_decision.request.json` | `POST /api/v1/task/{plan_id}/approval` request |
| `approval_decision.response.json` | `POST /api/v1/task/{plan_id}/approval` response |
| `auth_handshake.response.json` | `POST /api/v1/auth/handshake` response |
| `tools_list.response.json` | `GET /api/v1/tools` response |
| `tools_invoke.request.json` | `POST /api/v1/tools/invoke` request |
| `tools_invoke.response.json` | `POST /api/v1/tools/invoke` response |

## Sync workflow: Receiving Backend updates

### Step 1: Get updated fixtures from Backend

Check Backend repo's `contracts/fixtures/v1/` for the canonical backend-owned mirror payloads and compare with current Interface fixtures.

### Step 2: Update fixture JSON files

Update the relevant `contracts/v1/*.json` files to match the new schema.

### Step 3: Update TypeScript types

Update `sdk/client/types.ts` to match the new fixture shapes.

### Step 4: Update Zod validators

Update validators in `sdk/validators/` to match new schema fields.

### Step 5: Run tests

```bash
npm run typecheck   # Verify types compile
npm test            # Run contract + compatibility tests
```

## Contract evolution rules

1. **Never mutate v1** — existing fields cannot change type or be removed
2. **Additive only for v1** — new optional fields can be added
3. **Breaking changes → v2** — create new `contracts/v2/` directory
4. **Fixture-first** — update fixtures before SDK types
5. **Backend is canonical** — backend golden tests are the source of truth
6. **Fixture drift = breaking change** — must be caught in CI
