# Changelog

## 0.2.0-rc.1 (2026-02-16)

- Synced `contracts/v1` fixture mirror with backend canonical payload shapes for session, delta, task, approval, auth, and tools contracts.
- Added additive `contracts/v1/realtime` fixtures and typed schemas for streaming events: `chat.*`, `orch.*`, `job.*`, `lock.*`, and `session.resync_required`.
- Added additive `contracts/v1/gateway` fixtures and typed schemas for gateway payloads: realtime negotiate, task status, locks list, and lock release.
- Expanded `PhoenixClient` with typed methods: `realtimeNegotiate`, `taskStatus`, `locksList`, and `lockRelease`.
- Expanded contract and transport tests for realtime envelopes, timeout retry behavior, and `409` conflict expectations.
- Added Engine consumer migration note at `docs/ENGINE_MIGRATION_0.2.0-rc.1.md`.
