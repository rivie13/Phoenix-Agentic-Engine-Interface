---
applyTo: "**"
excludeAgent: "coding-agent"
---

# Copilot code review instructions (Interface repo)

You are reviewing PRs for the public Interface SDK of Phoenix Agentic Engine.
Priorities: maintain contract compatibility, enforce publish-safe boundaries, and follow TypeScript conventions.

## Review focus

- This is a **protocol layer**, not a UI product. Code should define contracts, transport, validation, and typed client logic only.
- Watch for any orchestration logic, prompt content, agent coordination, or policy/risk logic leaking into this repo — those belong in the backend.
- Any schema change in `contracts/v1/` is potentially breaking. Require explicit justification and coordinated fixture updates.
- New contract versions (`v2`, etc.) should be additive, not mutations of existing `v1` payloads.

## What must NOT be in this repo

- System prompts or prompt templates
- Orchestration logic or agent coordination
- Model routing or selection intelligence
- Approval policy rules or risk scoring
- Prompt sanitization pipeline
- Usage metering or billing logic
- UI/UX code (approval dialogs, chat panels, etc.)

## TypeScript coding standards (what to enforce)

- Match existing style in the edited file.
- Use strict TypeScript (`strict: true` in tsconfig).
- Prefer Zod schemas for runtime validation.
- Use `camelCase` for functions/variables, `PascalCase` for types/interfaces/classes.
- Prefer explicit types over `any` — flag `any` usage.
- Use `readonly` where mutation is not needed.
- Prefer `interface` for public API shapes, `type` for unions/intersections.

## Safety / correctness checks

- Validate that request/response types match the golden fixtures in current form of contracts:  `contracts/v1/`, `contracts/v2/`, etc.
- Ensure transport code handles errors, retries, and timeouts correctly.
- Check that validators reject malformed payloads, not just accept valid ones.
- Watch for accidental exposure of auth tokens or credentials in logs or errors.

## Scope & hygiene

- Keep PR scope tight; ask to split unrelated refactors.
- Avoid adding dependencies without justification — this SDK should stay lightweight.
- Avoid adding secrets, credentials, or proprietary content anywhere in the repo.
- Ensure all new code has corresponding test coverage.

## What to request from authors (when missing)

- Explanation of why a contract change is needed and backward compatibility assessment.
- Test results (`npm test` output).
- If fixtures changed: confirmation that backend golden tests also pass.
