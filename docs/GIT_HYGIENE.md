# Git Hygiene (Interface Repo)

This repo is a protocol SDK and contract layer. Keep changes small, validated, and reviewable.

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

- Prefer GitHub MCP tools for PR and review operations
- Include in PR body:
  - summary of changes
  - rationale
  - compatibility notes (especially contract changes)
  - validation results
- Check PR GitHub Actions/workflow runs; if any job fails, inspect logs, fix root causes, and re-run checks
- Request Copilot review and address comments before final human review

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
