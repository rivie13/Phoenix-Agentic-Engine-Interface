# v1 Fixture Mirror

This folder contains a publish-safe mirror of `v1` request/response fixtures used by SDK and compatibility tests.

These files are **not** the canonical source of truth. Canonical fixtures and golden tests remain in the private backend repository.

Current layout:

- Root `*.request.json` / `*.response.json` files mirror core v1 HTTP contracts (session, delta, task, approval, auth, tools).
- `realtime/` contains additive v1 server-event payload fixtures (`chat.*`, `orch.*`, `job.*`, `lock.*`, `session.resync_required`).
- `gateway/` contains additive v1 gateway payload fixtures (`realtime_negotiate`, `task_status`, `locks_list`, `lock_release`).

Task contract note:

- `task_request.response.json` is the canonical queued-ack payload (`task_queued_ack`).
- `ProposedActionBatch` payloads are represented under status/realtime fixtures (for example `gateway/task_status.response.json` and `realtime/plan_ready.json`).
