
# PRIVATE — Roadmap and integration context (do NOT commit)

## Interface repo status

**Phase 1 foundation is complete.** The Interface repo has:
- Versioned contract fixtures for all v1 endpoints (`contracts/v1/`)
- Typed SDK client (`PhoenixClient`) with all v1 endpoint methods
- Transport layer with exponential backoff and retry logic
- Request/response validators using Zod
- Contract compatibility tests and local smoke test
- Full project documentation (`docs/CLIENT_BACKEND_CONNECTION.md`)

**Next steps for Interface repo:**
- Keep contract fixtures in sync as backend evolves
- Add WebSocket transport support for real-time streaming (delta sync, completions)
- Add `v2` contract namespace when breaking changes are needed
- Expand test coverage for edge cases (malformed payloads, timeout scenarios)
- Publish as npm package when ready for external consumption

## How Interface fits into overall project phases

| Phase | Interface repo involvement |
|-------|---------------------------|
| Phase 0 (Foundation) | ✅ Complete — contracts, SDK, tests |
| Phase 1 (Assistant UI) | Engine integrates this SDK into adapter layer |
| Phase 2 (Shadow Tree) | Add delta sync transport, sequence validation |
| Phase 3 (MCP Bridge) | Add tool invocation contract types |
| Phase 4 (Multi-agent) | Add parallel plan / worktree contract types |
| Phase 6+ | WebSocket streaming, advanced transport features |

## Contract evolution rules

1. **Never mutate v1** — existing fields cannot change type or be removed
2. **Additive only** — new optional fields can be added to v1
3. **Breaking changes → v2** — new version namespace, parallel support
4. **Fixture-first** — update fixtures before updating SDK types
5. **Backend is canonical** — backend golden tests are the source of truth

## Working principles (Interface-specific)

1. **Stay protocol-only** — no UI, no orchestration, no business logic.
2. **Contract compatibility is non-negotiable** — fixture tests must pass.
3. **Keep dependencies minimal** — Zod for validation, that's it.
4. **Both Engine and Backend depend on this repo** — changes here affect both consumers.
5. **Document breaking changes explicitly** — in PR description and changelog.
6. **Test edge cases** — malformed payloads, network errors, retry exhaustion.
