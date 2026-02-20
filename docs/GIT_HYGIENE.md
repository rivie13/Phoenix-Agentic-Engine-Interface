# Git Hygiene (Interface Repo)

This repo is a protocol SDK and contract layer. Keep changes small, validated, and reviewable.

## CLI tool policy (mandatory)

- **NEVER use `gh` CLI** — it is not installed and must not be used.
- **Always prefer GitHub MCP tools** (`mcp_github_*`) for all GitHub operations.
- Fall back to terminal `git` commands only for local worktree operations or when MCP tools fail.
- Do NOT suggest or attempt any `gh` subcommand.

## Branch hygiene

- Branch from `main`
- Use focused branch names (`feature/*`, `fix/*`, `contract/*`, `chore/*`)
- Keep one concern per branch/PR
- Re-sync with `main` before opening/updating PR

## Validation before commit

Run these commands from repo root:

```bash
npm run lint
npm run typecheck
npm test
```

If a command fails, fix before commit.

## Commit hygiene

- Keep commits atomic
- Stage only relevant files
- Use clear commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)

## Pull request hygiene

- **Always use GitHub MCP tools** for PR and review operations — never `gh` CLI.
- Include in PR body:
  - **Summary**: What changed and why
  - **Changes**: Bullet list of key changes
  - **Testing**: Validation results
  - **Breaking changes**: Compatibility notes (especially contract changes)
  - **Related issues**: Link with `Closes #N` or `Relates to #N`
- Check PR GitHub Actions/workflow runs; if any job fails, inspect logs, fix root causes, and re-run checks
- Request Copilot review and address comments before final human review

## PR size discipline (mandatory)

- Keep PRs small and focused — one logical change per PR.
- If a feature branch grows large, break it into sub-branches targeting the feature branch.
- Target: PRs should ideally be under ~400 lines of meaningful change.
- Flag oversized PRs and split before requesting review.

## Issue creation (public repo)

- Create issues using `mcp_github_github_issue_write` — never `gh issue create`.
- For non-sensitive, public-facing work: assign to Copilot (cloud agent) using `mcp_github_github_assign_copilot_to_issue`.
- Do NOT create public issues for private/sensitive matters.
- Search for existing issues before creating duplicates.

## Review workflow

For each review comment:

1. Confirm understanding
2. Apply focused fix
3. Re-run relevant checks
4. Reply with concise resolution

## Interface-specific guardrails

- Keep this repo protocol-only (no UI or orchestration logic)
- Treat `contracts/v1` changes as potentially breaking
- Ensure fixture + validator + test updates stay in sync
