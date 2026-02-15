---
name: phase-planning
description: Navigate the Phoenix project roadmap, understand current phase status, plan next tasks, and track what needs to be done. Use when user asks what to work on next, current project status, phase progress, roadmap, task planning, or what's left to do.
---

# Phase Planning — Phoenix Agentic Engine Interface

## Repo Context

This is the **Interface SDK** (TypeScript). It defines contracts between Engine and Backend.

## Current Status

- **Phase 1 foundation**: Complete — fixtures, typed SDK, transport, validators, tests

## Next steps

- Keep contract fixtures in sync as backend evolves
- Add WebSocket transport support for real-time streaming (Phase 5+)
- Add `v2` contract namespace when breaking changes are needed
- Expand test coverage for edge cases
- Publish as npm package when ready for external consumption

## How Interface fits into project phases

| Phase | Interface involvement |
|-------|----------------------|
| Phase 0 | Complete — contracts, SDK, tests |
| Phase 1 | Engine integrates SDK into adapter layer |
| Phase 2 | Add delta sync transport, sequence validation |
| Phase 3 | Add tool invocation contract types |
| Phase 4 | Add parallel plan / worktree contract types |
| Phase 5+ | WebSocket streaming, advanced transport |

## Key deliverables this repo owns

- `contracts/v1/*.json` — golden fixture mirrors
- `sdk/client/PhoenixClient.ts` — typed HTTP client
- `sdk/client/types.ts` — request/response TypeScript types
- `sdk/transport/` — HTTP transport with retry/backoff
- `sdk/validators/` — Zod validation schemas
- `tests/contract/` — fixture validation tests
- `tests/compatibility/` — SDK compatibility tests

## Working principles

1. Stay protocol-only — no UI, no orchestration, no business logic
2. Contract compatibility is non-negotiable
3. Keep dependencies minimal
4. Both Engine and Backend depend on this repo
5. Test edge cases — malformed payloads, network errors, retry exhaustion
