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
- If a feature branch grows large, break it into sub-branches:
  1. Create sub-branches off the feature branch for discrete pieces of work.
  2. Open PRs from each sub-branch into the feature branch.
  3. Once sub-branch PRs are merged into the feature branch, open a single PR from the feature branch into `main`.
- Target: PRs should ideally be under ~400 lines of meaningful change.
- If a PR exceeds this, strongly consider splitting before requesting review.

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
  base="main"
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

- `feature/<name>` — new features
- `fix/<name>` — bug fixes
- `contract/<name>` — contract/schema changes

## Issue creation (public repo — never use `gh` CLI)

- Create issues using `mcp_github_github_issue_write`.
- For non-sensitive, public-facing work: assign to Copilot (cloud agent) using `mcp_github_github_assign_copilot_to_issue`.
- Do NOT create public issues for private/sensitive matters (secrets, auth, proprietary logic, security vulnerabilities).
- Search for existing issues before creating duplicates using `mcp_github_github_search_issues`.
- Use issues to break large features into smaller, trackable units of work.
