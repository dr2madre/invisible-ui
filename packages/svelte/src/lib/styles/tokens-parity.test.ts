// @vitest-environment node
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("canonical tokens match all runtime adapters in both modes", () => {
  const root = fileURLToPath(new URL("../../../../../", import.meta.url));
  expect(() =>
    execFileSync(process.execPath, ["--test", "scripts/token-runtime.test.mjs"], {
      cwd: root,
      stdio: "pipe",
    }),
  ).not.toThrow();
});
