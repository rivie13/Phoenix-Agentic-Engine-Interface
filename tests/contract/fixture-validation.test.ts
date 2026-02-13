import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FixtureSchemaByFileName } from "../../sdk/validators/schemas.js";

const fixtureRoot = fileURLToPath(new URL("../../contracts/v1", import.meta.url));

describe("Contract fixture validation", () => {
  for (const [fileName, schema] of Object.entries(FixtureSchemaByFileName)) {
    it(`validates ${fileName}`, () => {
      const raw = readFileSync(join(fixtureRoot, fileName), "utf8");
      const payload = JSON.parse(raw);
      expect(payload).toHaveProperty("schema_version");
      expect(() => schema.parse(payload)).not.toThrow();
    });
  }
});
