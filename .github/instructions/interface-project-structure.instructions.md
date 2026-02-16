
# Project structure — Phoenix Agentic Engine Interface (TS SDK)

This repository is the public protocol layer (contracts, transport SDK, validators, compatibility tests) between the Phoenix engine client and private backend.

## Repository layout

| Path | Purpose | Edit policy |
|------|---------|-------------|
| `sdk/` | TypeScript SDK source | **Primary work area** |
| `sdk/client/` | `PhoenixClient` class and types | Active development |
| `sdk/transport/` | HTTP transport, backoff, error types | Active development |
| `sdk/validators/` | Zod-based request/response validators | Active development |
| `sdk/index.ts` | Public SDK entry point / barrel export | Stable |
| `contracts/` | Versioned golden fixture mirrors | **Careful changes only** |
| `contracts/v1/` | v1 contract JSON fixtures | Changes = potential breaking |
| `tests/` | All test suites | Active development |
| `tests/contract/` | Contract validation tests | Fixture compatibility |
| `tests/compatibility/` | SDK compatibility + smoke tests | Integration validation |
| `docs/` | Public documentation | Reference material |
| `.github/instructions/` | Copilot instruction files | Configuration |

## Directory structure

```
phoenix-agentic-engine-interface/
├── package.json              # Project config, scripts, dependencies
├── tsconfig.json             # TypeScript configuration (strict)
├── vitest.config.ts          # Test runner configuration
├── README.md                 # Public-facing project README
├── contracts/
│   └── v1/                   # v1 golden fixture mirror (from backend)
│       ├── session_start.request.json
│       ├── session_start.response.json
│       ├── delta_update.request.json
│       ├── delta_update.response.json
│       ├── task_request.request.json
│       ├── task_request.response.json
│       ├── approval_decision.request.json
│       ├── approval_decision.response.json
│       ├── auth_handshake.response.json
│       ├── tools_list.response.json
│       ├── tools_invoke.request.json
│       ├── tools_invoke.response.json
│       ├── gateway/           # task status / lock / realtime negotiate fixtures
│       ├── realtime/          # realtime server-event fixtures
│       └── README.md
├── sdk/
│   ├── index.ts              # Barrel export
│   ├── client/
│   │   ├── PhoenixClient.ts  # Typed HTTP client for all v1 endpoints
│   │   └── types.ts          # Request/response TypeScript types
│   ├── transport/
│   │   ├── backoff.ts        # Exponential backoff with jitter
│   │   ├── errors.ts         # Typed transport error classes
│   │   ├── phoenixTransport.ts # HTTP transport implementation
│   │   └── types.ts          # Transport/request option types
│   └── validators/           # Zod schemas for payload validation
├── tests/
│   ├── contract/             # Contract fixture validation tests
│   └── compatibility/        # SDK + smoke tests
├── docs/
│   ├── CLIENT_BACKEND_CONNECTION.md
│   ├── PUBLIC_CLIENT_BACKEND_CONNECTION.md
│   └── ENGINE_MIGRATION_0.2.0-rc.1.md
└── .github/
    ├── instructions/         # Copilot instruction files
    └── workflows/            # CI/CD workflows (includes ci.yml)
```

## Key principles

1. **Protocol-only** — this repo defines contracts and transport, not UI or orchestration.
2. **Contract stability** — changes to `contracts/v1/` fixtures are potentially breaking for both Engine and Backend consumers.
3. **Lightweight** — minimal dependencies (Zod for validation + dev tooling only).
4. **Both repos depend on this** — Engine and Backend both consume these types and contracts.
5. **Backend is canonical** — golden fixtures originate from the backend; this repo carries the published mirror.
6. **Test everything** — contract tests, compatibility tests, and smoke tests must all pass before merging.
