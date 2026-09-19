import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { STEPS } from "./gate.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ci = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
const runLines = [...ci.matchAll(/^\s*run:\s*(.+)$/gm)].map((m) => m[1].trim());

// The workflow may install and then run the gate, nothing else: a check added
// only there would never run locally, and one added only locally would never
// block a merge.
test("CI runs the gate and nothing beside it", () => {
  assert.deepEqual(runLines, ["pnpm install --frozen-lockfile", "pnpm gate"]);
});

test("the gate lists every check the previous workflow ran, and the API manifests", () => {
  const commands = STEPS.map(([, command]) => command).join("\n");
  for (const required of [
    "pnpm lint",
    "pnpm format:check",
    "check-changeset.mjs",
    "pnpm tokens:check",
    "pnpm tokens:test",
    "pnpm demos:check",
    "turbo run build test typecheck check",
    "pnpm api:check",
    "pnpm api:report:check",
    "pnpm api:runtime-check",
    "run smoke",
    "pnpm consumers:check",
    "pnpm size",
    "check-env.mjs",
  ]) {
    assert.match(commands, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), required);
  }
});

test("step names are unique, so --from is unambiguous", () => {
  const names = STEPS.map(([name]) => name);
  assert.equal(new Set(names).size, names.length);
});
