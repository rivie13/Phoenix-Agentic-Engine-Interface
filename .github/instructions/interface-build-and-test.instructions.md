
# Build and test — Phoenix Agentic Engine Interface (TS SDK)

## Setup

```bash
npm install
```

## Build

```bash
# TypeScript compilation
npm run build

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

- All contract and compatibility tests must pass before merging.
- Tests must be deterministic and must not require network access (except explicit smoke tests).
- PRs should include what was tested and how.
- Golden fixture compatibility tests must pass — fixture drift is a breaking change.
- Type-check (`npm run typecheck`) must succeed with zero errors.
