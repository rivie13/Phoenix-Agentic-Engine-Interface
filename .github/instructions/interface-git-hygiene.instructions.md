# Git hygiene and GitHub MCP workflow — Phoenix Agentic Engine Interface

## Scope

This file defines branch, commit, validation, and pull request hygiene for the Interface repo.
Use it whenever making code changes, preparing pull requests, or handling review feedback.

## CLI tool policy (mandatory)

- **NEVER use `gh` CLI** — it is not installed in this environment and must not be used.
- **Always prefer GitHub MCP tools** (`mcp_github_*`) for all GitHub operations (PRs, issues, reviews, actions, branches, searches, etc.).
- Fall back to terminal `git` commands only for local worktree operations (status, add, commit, branch, checkout, rebase, push, pull, diff, log) or when MCP tools fail/are unavailable.
- Do NOT suggest or attempt `gh pr create`, `gh issue create`, `gh run list`, or any other `gh` subcommand.

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

- **Always use GitHub MCP tools** for PR operations — never `gh` CLI.
- Before creating PR:
  - Ensure branch is up to date
  - Ensure lint/typecheck/tests pass
  - Confirm scope is limited to one logical change
- After creating/updating PR:
  - Check GitHub Actions/workflow run status for the PR
  - If any workflow/job fails, fetch logs and fix the root cause
  - Re-run validations locally and re-trigger/recheck workflow runs
  - Do not mark PR ready while required checks are failing
- PR description should include (use MCP tools to set):
  - **Summary**: What changed and why
  - **Changes**: Bullet list of key changes
  - **Testing**: Validation commands and outcomes
  - **Breaking changes**: Backward compatibility notes (especially contracts)
  - **Related issues**: Link related issues with `Closes #N` or `Relates to #N`
- Treat Copilot review as auto-requested by default when available.
- Only request Copilot review manually when no Copilot review exists for the latest commit set on the PR.

## Review hygiene (Copilot + humans)

- Fetch and address unresolved review comments.
- For each comment:
  1. Reproduce/understand issue
  2. Apply focused fix
  3. Re-run relevant validations
  4. Respond with what changed and why
- Re-request review when follow-up changes are done.

## GitHub MCP tool preference

**Always use MCP tools** — never `gh` CLI. Prefer MCP tools for:
- Creating and updating PRs
- Listing PRs/reviews/comments
- Checking whether Copilot review already exists
- Requesting Copilot review only when missing for latest commits
- Reading and responding to review feedback
- Listing workflow runs/jobs and reviewing failed logs
- Creating and managing issues
- Searching for existing issues

Terminal git is still appropriate for local worktree tasks (status, branch, add/commit, rebase, tests).

## PR size discipline (mandatory)

- Keep PRs small and focused — one logical change per PR.
- If a feature branch grows large, break it into sub-branches:
  1. Create sub-branches off the feature branch for discrete pieces of work.
  2. Open PRs from each sub-branch into the feature branch.
  3. Once sub-branch PRs are merged into the feature branch, open a single PR from the feature branch into `main`.
- Target: PRs should ideally be under ~400 lines of meaningful change (excluding generated files, lock files, fixtures).
- If a PR exceeds this, strongly consider splitting before requesting review.
- Never let PRs accumulate dozens of unrelated changes.

## Issue creation and Copilot assignment (public repo)

- Create GitHub issues for trackable work items using `mcp_github_github_issue_write` — never `gh issue create`.
- Use issues to break large features into smaller, trackable units of work.
- For public-facing, non-sensitive issues: assign to Copilot (cloud agent) when appropriate using `mcp_github_github_assign_copilot_to_issue`.
- Do NOT create public issues or assign to Copilot for work involving private/sensitive matters (secrets, auth internals, proprietary logic, infrastructure details, security vulnerabilities).
- Search for existing issues before creating duplicates using `mcp_github_github_search_issues`.

## Interface-specific quality gate (required before PR readiness)

- `npm run lint` passes
- `npm run typecheck` passes
- `npm test` passes
- PR GitHub Actions checks are green (or explicitly understood/waived)
- Contract changes include fixture + validator/test updates
- No prompts, orchestration logic, or backend-only logic added to Interface repo
