---
name: update-copilot-instructions
description: Update Copilot instruction files to reflect current project state, architecture, phase progress, or conventions. Use when user asks to update instructions, refresh copilot context, sync instruction files with current reality, or update architecture/roadmap documentation in instruction files.
---

# Update Copilot Instructions — Phoenix Agentic Engine Interface

## Repo Context

- **Repo**: `Phoenix-Agentic-Engine-Interface` (TypeScript SDK — public)
- **Instruction location**: `.github/instructions/`

## Instruction files in this repo

| File | Purpose | Auto-loads? |
|------|---------|-------------|
| `interface-code-review.instructions.md` | PR review priorities | No (manual, `excludeAgent: "coding-agent"`) |
| `interface-coding-conventions.instructions.md` | TypeScript style, Zod, strict mode | No (manual) |
| `interface-build-and-test.instructions.md` | npm scripts, vitest, tsc | No (manual) |
| `interface-project-structure.instructions.md` | Directory layout, SDK organization | No (manual) |
| `interface-private-architecture.instructions.md` | SDK architecture, transport layer | No (manual) |
| `interface-private-roadmap.instructions.md` | Milestone plan, next tasks | No (manual) |
| `interface-private-strategy.instructions.md` | What belongs here vs Backend | No (manual) |

## How to update

### Step 1: Identify what changed

- Contract surface changed? → Update `interface-private-architecture.instructions.md`
- Phase advanced? → Update `interface-private-roadmap.instructions.md`
- Build process changed? → Update `interface-build-and-test.instructions.md`
- Conventions changed? → Update `interface-coding-conventions.instructions.md`
- Repo structure changed? → Update `interface-project-structure.instructions.md`
- Strategy shifted? → Update `interface-private-strategy.instructions.md`
- Review priorities changed? → Update `interface-code-review.instructions.md`

### Step 2: Read the current file and update it

Use `read_file` to load, then edit with current state.

### Step 3: Keep instructions concise

- State facts, not procedures (procedures go in skills)
- Use tables over prose
- Target under 50 lines per file

### Step 4: Cross-repo consistency

If the change affects contracts, update corresponding files in:
- `Phoenix-Agentic-Engine-Backend/.github/instructions/`
- `Phoenix-Agentic-Engine/.github/instructions/`

### Step 5: Verify no secrets leaked (PUBLIC repo)

This is a **public** repo. Instruction files must NOT contain:
- System prompts or prompt templates
- API keys or credentials
- Orchestration implementation details

## Instruction file format

### Manual-only (most files)
```markdown
# Title

Content here. Keep it concise.
```
No frontmatter = manual-only. Agent loads these via the `load-interface-instructions` skill.

### With excludeAgent guard (code-review only)
```markdown
---
excludeAgent: "coding-agent"
---

# Title

Content here.
```
The `excludeAgent` guard prevents the autonomous coding agent from using this file even if manually attached.
