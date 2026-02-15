---
name: github-actions-debug
description: Debug failed GitHub Actions CI/CD workflow runs. Use when user asks to fix CI, debug a failed workflow, check why a build failed, investigate GitHub Actions errors, or troubleshoot pipeline failures.
---

# GitHub Actions Debug — Phoenix Agentic Engine Interface

## Repo Context

- **Owner**: `rivie13`
- **Repo**: `Phoenix-Agentic-Engine-Interface`
- **Type**: Public (TS SDK + Contracts)

## Workflows in this repo

| Workflow file | Purpose |
|---------------|---------|
| `ci.yml` | Typecheck (tsc) + Test (vitest) on push/PR to main |

## CI Pipeline Details

The `ci.yml` workflow runs:
1. **Checkout** code
2. **Setup Node.js** 20 with npm cache
3. **Install dependencies**: `npm ci`
4. **Typecheck**: `npm run typecheck`
5. **Test**: `npm test`

## Debugging Workflow: Step-by-step

### Step 1: List recent workflow runs

```
mcp_github_github_actions_list(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface")
```

### Step 2: Get details of a specific run

```
mcp_github_github_actions_get(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", run_id=<RUN_ID>)
```

### Step 3: Get job logs for the failed job

```
mcp_github_github_get_job_logs(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", job_id=<JOB_ID>)
```

### Step 4: Analyze the failure

Common failure patterns:

| Failure type | Typical cause | Fix |
|-------------|---------------|-----|
| TypeScript error | Type mismatch, missing type annotations | Run `npm run typecheck` locally |
| Vitest failure | Test assertion error, fixture drift | Run `npm test` locally |
| Contract fixture mismatch | Fixture JSON doesn't match Zod schema | Sync fixtures with backend golden tests |
| `npm ci` failure | Lock file out of sync | Run `npm install` and commit `package-lock.json` |
| `any` type flagged | Strict mode violation | Replace `any` with proper types |

### Step 5: Fix locally and verify

1. Read the error from the job logs
2. Run locally:
   - `npm run typecheck` — reproduce type errors
   - `npm test` — reproduce test failures
3. Make the fix
4. Run both typecheck and test to confirm

### Step 6: Re-trigger the workflow (optional)

```
mcp_github_github_actions_run_trigger(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", workflow_id="ci.yml")
```
