
# Build and test — Phoenix Agentic Engine Interface (TS SDK)

## Repo-scoped terminal/tool discipline (required)

- In this multi-repo workspace, only run Interface commands from the Interface repo root:
	- `C:\Users\rivie\vsCodeProjects\Phoenix-Agentic-Engine-Interface`
- Before running scripts/tasks/tools, verify scope in the active terminal:
	- `Get-Location`
	- `git rev-parse --show-toplevel`
	- `git branch --show-current`
- If repo root or branch is wrong, open a fresh terminal for this repo and re-run the checks.
- Do not run Interface scripts from Engine or Backend terminal contexts.

## Setup

```bash
npm install
```

## Build

```bash
# TypeScript compilation
npm run build

# Lint
npm run lint

# Type-check only (no emit)
npm run typecheck
```

## Testing

```bash
# Run all tests (contract + compatibility)
npm test

# Watch mode during development
npm run test:watch

# Local smoke test against running backend (http://127.0.0.1:8000)
npm run test:smoke
```

## Validation expectations

- Lint (`npm run lint`) must succeed with zero errors.
- All contract and compatibility tests must pass before merging.
- Tests must be deterministic and must not require network access (except explicit smoke tests).
- PRs should include what was tested and how.
- Golden fixture compatibility tests must pass — fixture drift is a breaking change.
- Type-check (`npm run typecheck`) must succeed with zero errors.
