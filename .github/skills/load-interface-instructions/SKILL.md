---
name: load-interface-instructions
description: Load Interface repo instruction files into context. Use when working on Interface SDK code and needing coding conventions, build instructions, project structure, architecture, roadmap, or strategy context for the TypeScript SDK.
---

# Load Interface Instructions

## When to use

When working on code in the **Phoenix-Agentic-Engine-Interface** repo (TypeScript SDK + contracts) and you need repo-specific context. The agent should read the relevant instruction files to understand conventions, architecture, and project structure.

## Available instruction files

All files live in `Phoenix-Agentic-Engine-Interface/.github/instructions/`:

| File | Content | When to load |
|------|---------|-------------|
| `interface-coding-conventions.instructions.md` | TypeScript style, Zod, strict mode | When writing or reviewing code |
| `interface-build-and-test.instructions.md` | npm scripts, vitest, tsc | When building, testing, or fixing errors |
| `interface-project-structure.instructions.md` | Directory layout, SDK organization | When navigating the codebase or adding new files |
| `interface-private-architecture.instructions.md` | SDK architecture, transport layer | When making architectural decisions |
| `interface-private-roadmap.instructions.md` | Milestone plan, next tasks | When planning work or checking status |
| `interface-private-strategy.instructions.md` | What belongs here vs Backend | When deciding where code should live |

**Also available**: `interface-code-review.instructions.md` — manual-only, load when reviewing PRs. Has `excludeAgent` guard to block the autonomous coding agent.

## How to load

Read the files you need using `read_file`. Common patterns:

### Starting coding work
```
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-coding-conventions.instructions.md")
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-project-structure.instructions.md")
```

### Build/test troubleshooting
```
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-build-and-test.instructions.md")
```

### Architecture/planning
```
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-private-architecture.instructions.md")
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-private-roadmap.instructions.md")
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-private-strategy.instructions.md")
```

### Load all (when full context is needed)
```
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-coding-conventions.instructions.md")
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-build-and-test.instructions.md")
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-project-structure.instructions.md")
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-private-architecture.instructions.md")
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-private-roadmap.instructions.md")
read_file("Phoenix-Agentic-Engine-Interface/.github/instructions/interface-private-strategy.instructions.md")
```
