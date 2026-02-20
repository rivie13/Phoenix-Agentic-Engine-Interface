---
name: pr-management
description: Create, update, and manage GitHub pull requests across Phoenix repos. Use when user asks to create a PR, update a PR description, push changes, list PRs, merge a PR, check PR status, or manage branches.
---

# PR Management — Phoenix Agentic Engine Interface

## CLI tool policy (mandatory)

- **NEVER use `gh` CLI** — it is not installed and must not be used.
- **Always prefer GitHub MCP tools** (`mcp_github_*`) for all GitHub operations.
- Fall back to terminal `git` commands only for local worktree operations or when MCP tools fail.
- Do NOT suggest or attempt any `gh` subcommand.

## Repo Context

- **Owner**: `rivie13`
- **Repo**: `Phoenix-Agentic-Engine-Interface`
- **Default branch**: `main`

## PR size discipline (mandatory)

- Keep PRs small and focused — one logical change per PR.
- Use the three-tier branch hierarchy to keep PRs reviewable:
  1. Create `subfeature/<type>/<description>` branches off the parent `feature/<topic>` branch for discrete pieces of work.
  2. Open PRs from each subfeature branch into the feature branch (small, reviewable).
  3. Once subfeature PRs are merged, open a single PR from the feature branch into `main` (large, expected).
- Target: Subfeature PRs should ideally be under ~400 lines of meaningful change.
- If a PR exceeds this, strongly consider splitting into additional subfeature branches before requesting review.

### Branch hierarchy

| Tier | Pattern | Branches from | PR targets |
|---|---|---|---|
| Stable | `main` | — | — |
| Feature | `feature/<topic>` | `main` | `main` |
| Subfeature | `subfeature/<type>/<description>` | `feature/<topic>` | `feature/<topic>` |

## Create a Pull Request

### Step 1: Check for PR template

```
mcp_github_github_get_file_contents(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", path=".github/PULL_REQUEST_TEMPLATE.md")
```

### Step 2: Create the PR

```
mcp_github_github_create_pull_request(
  owner="rivie13",
  repo="Phoenix-Agentic-Engine-Interface",
  title="<descriptive title>",
  body="<description>",
  head="<feature-branch>",
  base="<parent branch>"  # main for feature branches; feature/<topic> for subfeature branches
)
```

### PR description should include (use MCP tools to set):
- **Summary**: What changed and why
- **Changes**: Bullet list of key changes
- **Testing**: What was tested and how, with pass/fail results
- **Breaking changes**: Backward compatibility assessment for any contract changes
- **Related issues**: Link related issues with `Closes #N` or `Relates to #N`
- Test results (`npm test` output)
- If fixtures changed: confirmation that backend golden tests also pass

## List Open PRs

```
mcp_github_github_list_pull_requests(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", state="open")
```

## Request Copilot Review

Copilot review is often auto-triggered. Before requesting manually, check whether a Copilot review already exists for the latest commit set on the PR.

Use:

```
mcp_github_github_pull_request_read(method="get_reviews", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
```

Only request Copilot review if it is missing for the latest commits:

```
mcp_github_github_request_copilot_review(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
```

## Verify PR workflow checks

Before marking a PR ready/mergeable:

```text
mcp_github_github_actions_list(method="list_workflow_runs", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface")
mcp_github_github_actions_list(method="list_workflow_jobs", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", resource_id="<RUN_ID>")
```

If any workflow/job failed, fetch logs, fix root causes, and re-check until required checks are green.

## Branch conventions

- `feature/<name>` — large deliverables (epic-level), branches from `main`, PR targets `main`
- `subfeature/task/<name>` — new functionality within a feature
- `subfeature/bugfix/<name>` — bug fixes within a feature
- `subfeature/refactor/<name>` — refactoring within a feature
- `subfeature/test/<name>` — test additions/fixes within a feature
- `subfeature/docs/<name>` — documentation within a feature
- `subfeature/chore/<name>` — maintenance/tooling within a feature
- `contract/<name>` — contract/schema changes (legacy, prefer subfeature pattern)

## Issue creation (public repo — never use `gh` CLI)

- Create issues using `mcp_github_github_issue_write`.
- For non-sensitive, public-facing work: assign to Copilot (cloud agent) using `mcp_github_github_assign_copilot_to_issue`.
- Do NOT create public issues for private/sensitive matters (secrets, auth, proprietary logic, security vulnerabilities).
- Search for existing issues before creating duplicates using `mcp_github_github_search_issues`.
- Use issues to break large features into smaller, trackable units of work.

## Issue–branch alignment

| Issue type | Label | Branch pattern | PR target |
|---|---|---|---|
| Epic | `epic` | `feature/<topic>` | `main` |
| Task | `task` | `subfeature/task/<description>` | `feature/<topic>` |
| Bug | `bug` | `subfeature/bugfix/<description>` | `feature/<topic>` |
| Refactor | `refactor` | `subfeature/refactor/<description>` | `feature/<topic>` |
| Test | `test` | `subfeature/test/<description>` | `feature/<topic>` |
| Docs | `docs` | `subfeature/docs/<description>` | `feature/<topic>` |
| Chore | `chore` | `subfeature/chore/<description>` | `feature/<topic>` |

- Epic issues map to `feature/*` branches; close the epic when the feature branch merges to `main`.
- Sub-issues map to `subfeature/<type>/<description>` branches; close with `Closes #N` in the subfeature PR.
- Create sub-issues via `mcp_github_github_sub_issue_write`.
