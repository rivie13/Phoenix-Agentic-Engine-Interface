import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  validateApprovalDecisionRequest,
  validateCommandResponse,
  validateDeltaUpdateRequest,
  validateProposedActionBatch,
  validateSessionStartSnapshotRequest,
  validateTaskRequest,
  validateTaskRequestAcceptedResponse,
  validateTaskStatusResponse
} from "../../sdk/validators/index.js";

type Validator = (payload: unknown) => unknown;

const configuredRoot = process.env.PHOENIX_BACKEND_FIXTURES_DIR?.trim();
const fallbackRoot = resolve(process.cwd(), "../Phoenix-Agentic-Engine-Backend/contracts/fixtures/v1");

const backendFixtureRoot = (() => {
  if (configuredRoot && existsSync(configuredRoot)) {
    return configuredRoot;
  }
  if (existsSync(fallbackRoot)) {
    return fallbackRoot;
  }
  return "";
})();

const maybeDescribe = backendFixtureRoot ? describe : describe.skip;

const fixtureCases: ReadonlyArray<{ fileName: string; validator: Validator }> = [
  { fileName: "session_start_snapshot.json", validator: validateSessionStartSnapshotRequest },
  { fileName: "delta_update.json", validator: validateDeltaUpdateRequest },
  { fileName: "task_request.json", validator: validateTaskRequest },
  { fileName: "task_request_accepted_response.json", validator: validateTaskRequestAcceptedResponse },
  { fileName: "task_status_response.json", validator: validateTaskStatusResponse },
  { fileName: "proposed_action_batch.json", validator: validateProposedActionBatch },
  { fileName: "approval_decision_request.json", validator: validateApprovalDecisionRequest },
  { fileName: "command_response.json", validator: validateCommandResponse }
];

const loadFixture = (fileName: string): unknown => {
  const fullPath = join(backendFixtureRoot, fileName);
  const raw = readFileSync(fullPath, "utf8");
  return JSON.parse(raw);
};

maybeDescribe("Backend fixture mirror validation", () => {
  it("finds backend fixture directory", () => {
    expect(backendFixtureRoot).not.toBe("");
  });

  for (const testCase of fixtureCases) {
    it(`validates backend fixture ${testCase.fileName} against Interface schema`, () => {
      const payload = loadFixture(testCase.fileName);
      expect(() => testCase.validator(payload)).not.toThrow();
    });
  }
});
