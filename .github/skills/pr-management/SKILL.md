---
name: pr-management
description: Create, update, and manage GitHub pull requests across Phoenix repos. Use when user asks to create a PR, update a PR description, push changes, list PRs, merge a PR, check PR status, or manage branches.
---

# PR Management — Phoenix Agentic Engine Interface

## Repo Context

- **Owner**: `rivie13`
- **Repo**: `Phoenix-Agentic-Engine-Interface`
- **Default branch**: `main`

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

### PR description should include:
- What was changed and why
- Backward compatibility assessment for any contract changes
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
