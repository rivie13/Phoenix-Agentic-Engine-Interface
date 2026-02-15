---
name: cross-repo-impact
description: Understand when a change in one Phoenix repo requires changes in the other repos. Use when user asks about cross-repo dependencies, what other repos need updating, impact analysis, or when making changes that affect the Engine-Backend-Interface boundary.
---

# Cross-Repo Impact Analysis — Phoenix Agentic Engine Interface

## Three-Repo Model

| Repo | Role | Visibility |
|------|------|------------|
| **Engine** | The Body — Godot fork, UI shell, local tool executors | Public |
| **Interface** (this repo) | The Nervous System — versioned API contracts, typed SDK | Public |
| **Backend** | The Brain — orchestration, prompts, model routing | Private |

## Impact matrix: "If I change X, what else needs updating?"

### Changes in THIS repo (Interface)

| What changed in Interface | Engine impact | Backend impact |
|--------------------------|--------------|----------------|
| Updated fixture JSON | Update adapter to match new shape | Update golden test expectations |
| Added new SDK method | Engine can now call new endpoint | None (Backend already has it) |
| New transport error type | Handle in MCP client | None |
| Breaking change (v2 namespace) | Update SDK integration for v2 | Implement v2 route handler |
| Validator schema change | None (Engine uses SDK types) | Verify response still validates |

### Changes in Engine that affect Interface

| What changed in Engine | Interface response needed |
|----------------------|--------------------------|
| Shadow Tree format change | Update delta contract types/fixtures if needed |
| New data sent to backend | May need new contract fixture |

### Changes in Backend that affect Interface

| What changed in Backend | Interface response needed |
|------------------------|--------------------------|
| New API response field | Update fixture JSON + SDK types + validators |
| New endpoint | Add fixture + SDK method + types + tests |
| Breaking schema change | Create `contracts/v2/` namespace |

## The Golden Rule

> **If it makes us money or makes us unique, it lives in the Backend.**
> **If it enables the community to contribute, it lives in the Engine.**
> **If it defines the contract between them, it lives here (Interface).**

## Checklist for cross-repo changes

1. Identify affected repos using the impact matrix
2. Get the canonical schema from Backend's `api/schemas/`
3. Update fixtures in `contracts/v1/`
4. Update types in `sdk/client/types.ts`
5. Update validators in `sdk/validators/`
6. Run `npm test` and `npm run typecheck`
7. Coordinate with Engine and Backend PRs

## What must NOT be in this repo

Even during cross-repo changes, never add:
- System prompts or prompt templates
- Orchestration logic or agent coordination
- Model routing or selection intelligence
- UI/UX code
- Credentials or secrets
