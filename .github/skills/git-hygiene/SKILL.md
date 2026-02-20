---
name: git-hygiene
description: Enforce branch hygiene, pre-commit validation, PR setup via GitHub MCP tools, and review follow-up workflow in the Interface repo.
---

# Git Hygiene — Phoenix Agentic Engine Interface

## CLI tool policy (mandatory)

- **NEVER use `gh` CLI** — it is not installed and must not be used.
- **Always prefer GitHub MCP tools** (`mcp_github_*`) for all GitHub operations.
- Fall back to terminal `git` commands only for local worktree operations or when MCP tools fail.
- Do NOT suggest or attempt any `gh` subcommand.

## Mandatory first step: terminal scope check

1. `Set-Location "C:\Users\rivie\vsCodeProjects\Phoenix-Agentic-Engine-Interface"`
2. `Get-Location`
3. `git rev-parse --show-toplevel`
4. `git branch --show-current`

## Branch workflow

1. Sync base branch:

```bash
git checkout main
git pull --ff-only
```

2. Create focused branch:

```bash
git checkout -b feature/<short-topic>
```

3. Keep PR scope single-purpose and small.

## PR size discipline (mandatory)

- Keep PRs small and focused — one logical change per PR.
- If a feature branch grows large, break it into sub-branches:
  1. Create sub-branches off the feature branch for discrete pieces of work.
  2. Open PRs from each sub-branch into the feature branch.
  3. Once sub-branch PRs are merged into the feature branch, open a single PR from the feature branch into `main`.
- Target: PRs should ideally be under ~400 lines of meaningful change.
- If a PR exceeds this, strongly consider splitting before requesting review.

## Pre-commit quality gate (required)

Run all:

```bash
npm run lint
npm run typecheck
npm test
```

If any command fails, fix before committing.

## Commit workflow

```bash
git status
git add <focused file set>
git commit -m "feat: <short summary>"
```

Recommended prefixes: `feat`, `fix`, `chore`, `docs`, `test`.

## PR workflow (use GitHub MCP tools — never `gh` CLI)

1. Create PR:

```text
mcp_github_github_create_pull_request(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", title="...", body="...", head="<branch>", base="main")
```

2. Check whether Copilot review already exists for the latest commits:

```text
mcp_github_github_pull_request_read(method="get_reviews", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
```

If Copilot review is missing for the latest commit set, request it:

```text
mcp_github_github_request_copilot_review(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
```

3. Read and handle reviews/comments:

```text
mcp_github_github_pull_request_read(method="get_reviews", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
mcp_github_github_pull_request_read(method="get_review_comments", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
```

4. Check PR workflow status and fix failures before merge readiness:

```text
mcp_github_github_actions_list(method="list_workflow_runs", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface")
mcp_github_github_actions_list(method="list_workflow_jobs", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", resource_id="<RUN_ID>")
```

If any job fails, use the GitHub Actions Debug skill flow to inspect logs, fix root causes, and re-run/recheck.

5. Apply fixes and re-run quality gate.

## Interface-specific checks for PR readiness

- `npm run lint` passes
- `npm run typecheck` passes
- `npm test` passes
- PR workflow/status checks are green
- Contract changes include fixture + schema + tests
- No backend-only logic added (prompts/orchestration/policy)

## Issue creation (public repo — never use `gh` CLI)

- Create issues using `mcp_github_github_issue_write`.
- For non-sensitive, public-facing work: assign to Copilot (cloud agent) using `mcp_github_github_assign_copilot_to_issue`.
- Do NOT create public issues for private/sensitive matters.
- Search for existing issues before creating duplicates using `mcp_github_github_search_issues`.
