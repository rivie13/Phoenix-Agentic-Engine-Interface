# Git hygiene and GitHub MCP workflow — Phoenix Agentic Engine Interface

## Scope

This file defines branch, commit, validation, and pull request hygiene for the Interface repo.
Use it whenever making code changes, preparing pull requests, or handling review feedback.

## Branch hygiene

- Always branch from `main` for new work.
- Keep one focused concern per branch/PR.
- Branch naming:
  - `feature/<short-topic>`
  - `fix/<short-topic>`
  - `contract/<short-topic>` for schema/fixture work
  - `chore/<short-topic>` for non-functional maintenance
- Avoid direct commits to `main`.
- Rebase/sync regularly with `main` to reduce merge drift.

## Commit hygiene

- Run validations before commit:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
- Keep commits atomic and reviewable.
- Commit message style (recommended):
  - `feat: ...`
  - `fix: ...`
  - `chore: ...`
  - `test: ...`
  - `docs: ...`
- Do not include unrelated file changes in the same commit.

## Pull request hygiene

- Prefer GitHub MCP tools for PR operations when available.
- Before creating PR:
  - Ensure branch is up to date
  - Ensure lint/typecheck/tests pass
  - Confirm scope is limited to one logical change
- After creating/updating PR:
  - Check GitHub Actions/workflow run status for the PR
  - If any workflow/job fails, fetch logs and fix the root cause
  - Re-run validations locally and re-trigger/recheck workflow runs
  - Do not mark PR ready while required checks are failing
- PR description should include:
  - What changed
  - Why it changed
  - Backward compatibility notes (especially contracts)
  - Validation commands and outcomes
- Request Copilot review before human review when possible.

## Review hygiene (Copilot + humans)

- Fetch and address unresolved review comments.
- For each comment:
  1. Reproduce/understand issue
  2. Apply focused fix
  3. Re-run relevant validations
  4. Respond with what changed and why
- Re-request review when follow-up changes are done.

## GitHub MCP tool preference

Prefer MCP tools over raw terminal git/GitHub commands for:
- Creating and updating PRs
- Listing PRs/reviews/comments
- Requesting Copilot review
- Reading and responding to review feedback
- Listing workflow runs/jobs and reviewing failed logs

Terminal git is still appropriate for local worktree tasks (status, branch, add/commit, rebase, tests).

## Interface-specific quality gate (required before PR readiness)

- `npm run lint` passes
- `npm run typecheck` passes
- `npm test` passes
- PR GitHub Actions checks are green (or explicitly understood/waived)
- Contract changes include fixture + validator/test updates
- No prompts, orchestration logic, or backend-only logic added to Interface repo
