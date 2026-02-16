import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateRealtimeServerEvent } from "../../sdk/validators/index.js";

const fixtureRoot = fileURLToPath(new URL("../../contracts/v1/realtime", import.meta.url));

const eventFixtureByFile: Readonly<Record<string, string>> = {
  "chat_delta.json": "chat.delta",
  "chat_done.json": "chat.done",
  "orch_step_start.json": "orch.step.start",
  "orch_step_log.json": "orch.step.log",
  "orch_step_end.json": "orch.step.end",
  "job_queued.json": "job.queued",
  "plan_ready.json": "plan.ready",
  "job_started.json": "job.started",
  "job_done.json": "job.done",
  "job_error.json": "job.error",
  "job_expired.json": "job.expired",
  "lock_acquired.json": "lock.acquired",
  "lock_released.json": "lock.released",
  "lock_conflict.json": "lock.conflict",
  "session_resync_required.json": "session.resync_required"
};

describe("Realtime event envelope validation", () => {
  for (const [fileName, expectedEvent] of Object.entries(eventFixtureByFile)) {
    it(`validates ${fileName}`, () => {
      const raw = readFileSync(join(fixtureRoot, fileName), "utf8");
      const payload = JSON.parse(raw);
      const parsed = validateRealtimeServerEvent(payload);

      expect(parsed.schema_version).toBe("v1");
      expect(parsed.event).toBe(expectedEvent);
    });
  }
});
