---
name: build-and-test
description: Build, test, lint, and validate the Phoenix Agentic Engine Interface SDK. Use when user asks to build, compile, test, typecheck, lint, fix test failures, or validate changes in the Interface repo.
---

# Build & Test — Phoenix Agentic Engine Interface (TypeScript SDK)

## Mandatory first step: terminal scope check

Before build/test commands, verify terminal scope:

1. `Set-Location "C:\Users\rivie\vsCodeProjects\Phoenix-Agentic-Engine-Interface"`
2. `Get-Location`
3. `git rev-parse --show-toplevel`
4. `git branch --show-current`

If scope is wrong, open a fresh Interface-scoped terminal and retry.

## Repo Identity

This is the **public Interface SDK** (TypeScript). It defines contracts between Engine and Backend.

## Quick Commands

```bash
# Install dependencies
npm install

# TypeScript compilation
npm run build

# Lint
npm run lint

# Type-check only (no emit)
npm run typecheck

# Run all tests (contract + compatibility)
npm test

# Watch mode during development
npm run test:watch

# Local smoke test against configured public gateway URL
npm run test:smoke
```

## Validation checklist

1. **Lint passes** — `npm run lint` must succeed with zero errors
2. **Typecheck passes** — `npm run typecheck` must succeed with zero errors
3. **All tests pass** — `npm test` (vitest)
4. **Golden fixtures valid** — contract tests in `tests/contract/` must pass
5. **Build succeeds** — `npm run build` compiles without errors

## Testing rules

- All contract and compatibility tests must pass before merging
- Tests must be deterministic — no network access (except explicit smoke tests)
- Golden fixture compatibility tests must pass — fixture drift is a breaking change
- Smoke tests (`npm run test:smoke`) require `PHOENIX_PUBLIC_GATEWAY_URL` (typically App Service URL)

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
| Fixture drift | Sync Interface `contracts/v1` with Backend `contracts/fixtures/v1` |
