---
name: github-code-review
description: Fetch and address GitHub pull request code review comments, including Copilot code reviews. Use when user asks to get review feedback, address review comments, fix review issues, request a code review, check PR reviews, or respond to reviewer feedback.
---

# GitHub Code Review — Phoenix Agentic Engine Interface

## Repo Context

- **Owner**: `rivie13`
- **Repo**: `Phoenix-Agentic-Engine-Interface`
- **Type**: Public (TS SDK + Contracts)

## Workflow: Fetch & Address Review Comments

### Step 1: Identify the PR

If the user doesn't specify a PR number, list open PRs:

```
mcp_github_github_list_pull_requests(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", state="open")
```

### Step 2: Get review comments

```
mcp_github_github_pull_request_read(method="get_review_comments", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
```

Get review status:

```
mcp_github_github_pull_request_read(method="get_reviews", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
```

### Step 3: Get changed files for context

```
mcp_github_github_pull_request_read(method="get_files", owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
```

### Step 4: Address each unresolved comment

For each unresolved review thread:
1. Read the file and surrounding context using `read_file`
2. Understand the reviewer's concern
3. Make the fix using file edit tools
4. Report what was changed and why

### Step 5: Request a new review (optional)

```
mcp_github_github_request_copilot_review(owner="rivie13", repo="Phoenix-Agentic-Engine-Interface", pullNumber=<PR_NUMBER>)
```

## Review priorities for this repo

When addressing reviews, keep these Interface SDK review priorities in mind:
- This is a **protocol layer** — no UI, no orchestration, no business logic
- Schema changes in `contracts/v1/` are potentially breaking — require justification
- No orchestration logic, prompt content, or agent coordination (those belong in Backend)
- Use strict TypeScript (`strict: true`) — flag any `any` usage
- Use Zod schemas for runtime validation
- Keep dependencies minimal — every new dep is a supply chain risk
- Ensure contract fixture compatibility tests still pass
- Run `npm test` and `npm run typecheck` after fixes
