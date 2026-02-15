---
name: build-and-test
description: Build, test, lint, and validate the Phoenix Agentic Engine Interface SDK. Use when user asks to build, compile, test, typecheck, lint, fix test failures, or validate changes in the Interface repo.
---

# Build & Test — Phoenix Agentic Engine Interface (TypeScript SDK)

## Repo Identity

This is the **public Interface SDK** (TypeScript). It defines contracts between Engine and Backend.

## Quick Commands

```bash
# Install dependencies
npm install

# TypeScript compilation
npm run build

# Type-check only (no emit)
npm run typecheck

# Run all tests (contract + compatibility)
npm test

# Watch mode during development
npm run test:watch

# Local smoke test against running backend (http://127.0.0.1:8000)
npm run test:smoke
```

## Validation checklist

1. **Typecheck passes** — `npm run typecheck` must succeed with zero errors
2. **All tests pass** — `npm test` (vitest)
3. **Golden fixtures valid** — contract tests in `tests/contract/` must pass
4. **Build succeeds** — `npm run build` compiles without errors

## Testing rules

- All contract and compatibility tests must pass before merging
- Tests must be deterministic — no network access (except explicit smoke tests)
- Golden fixture compatibility tests must pass — fixture drift is a breaking change
- Smoke tests (`npm run test:smoke`) require a running backend at `http://127.0.0.1:8000`

## Contract fixture locations

Golden fixtures live in `contracts/v1/`:
- `session_start.request.json` / `session_start.response.json`
- `delta_update.request.json` / `delta_update.response.json`
- `task_request.request.json` / `task_request.response.json`
- `approval_decision.request.json` / `approval_decision.response.json`
- `auth_handshake.response.json`
- `tools_list.response.json`
- `tools_invoke.request.json` / `tools_invoke.response.json`

## Common issues

| Error | Fix |
|-------|-----|
| Type errors after fixture change | Update types in `sdk/client/types.ts` to match new fixture shape |
| Vitest failures | Check `vitest.config.ts` and ensure `npm install` was run |
| `strict: true` errors | Fix type annotations — do not disable strict mode |
| Fixture drift | Fixtures mirror backend golden tests — sync with `api/schemas/` in Backend |
