// @vitest-environment node
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The docs props tables are auto-generated from the component source into
// packages/docs/src/generated/props/*.json (`pnpm api:generate`). This guards
// that the committed manifests are in sync with the components — name, type,
// default and required are derived from source, so they can never silently
// drift from the real props.
const root = fileURLToPath(new URL("../../../../", import.meta.url));

describe("generated API manifests", () => {
  it("are in sync with the component sources", () => {
    expect(() =>
      execFileSync("node", ["scripts/generate-api.mjs", "--check"], { cwd: root, stdio: "pipe" }),
    ).not.toThrow();
  });
});
