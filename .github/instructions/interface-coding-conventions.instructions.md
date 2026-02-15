
# Coding conventions — Phoenix Agentic Engine Interface (TS SDK)

## General rule

Match the style of the file you are editing — indentation, naming, import order, comment style.

## TypeScript conventions

- **Indentation**: tabs.
- **Naming**: `camelCase` for functions, variables, and parameters. `PascalCase` for classes, interfaces, types, and enums.
- **Strict mode**: all code must compile under `strict: true`.
- **No `any`**: avoid `any` — use `unknown` with type guards or explicit types instead.
- **Imports**: use ESM imports (`import` / `export`). Group imports: external deps first, then internal modules.
- **Validation**: use Zod schemas for runtime payload validation.
- **Error handling**: throw typed errors from `sdk/transport/errors.ts`. Avoid bare `throw new Error(...)` without context.
- **Readonly**: prefer `readonly` properties on interfaces/types that represent API responses or immutable data.

## Contract / schema conventions

- **Fixtures**: golden fixtures in `contracts/v1/` are JSON files. Keep them minimal and well-structured.
- **Versioning**: never mutate `v1` contract shapes in a breaking way. Create `v2` if breaking changes are needed.
- **Schema version field**: every top-level request/response payload must include `schema_version`.

## Patterns to prefer

- Zod schemas as the single source of truth for runtime validation.
- Small, focused modules over large files.
- Explicit return types on exported functions.
- Descriptive error messages that include context (endpoint, status code, etc.).
- Backward-compatible contract evolution (additive fields, optional new properties).

## Patterns to avoid

- `any` types or type assertions (`as`) without justification.
- Side effects in module-level code.
- Large dependency additions — this SDK must stay lightweight.
- Mixing transport/network concerns with validation/schema concerns.
- Hardcoded URLs or credentials anywhere in source.
