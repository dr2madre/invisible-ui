import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { STEPS } from "./gate.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ci = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");

// The workflow is held to one job that installs and runs the gate. Anything
// else there (another `run:`, another action, another job, a changed `env:`)
// would be a check that exists only in CI, or a way around the gate.
const jobs = ci.slice(ci.indexOf("\njobs:\n") + 1);
const jobNames = [...jobs.matchAll(/^ {2}([\w-]+):\s*$/gm)].map((m) => m[1]);
const stepKeys = [...jobs.matchAll(/^ {6}- ([\w-]+):/gm)].map((m) => m[1]);
const uses = [...jobs.matchAll(/^\s*-?\s*uses:\s*(.+)$/gm)].map((m) => m[1].trim());
const runs = [...jobs.matchAll(/^\s*-?\s*run:\s*(.+)$/gm)].map((m) => m[1].trim());
const withs = [...jobs.matchAll(/^ {10}([\w-]+):\s*(.+)$/gm)].map((m) => `${m[1]}: ${m[2].trim()}`);

test("CI has one job", () => {
  assert.deepEqual(jobNames, ["verify"]);
});

test("CI's steps are checkout, pnpm, Node, install, gate; nothing else", () => {
  assert.deepEqual(stepKeys, ["uses", "name", "name", "name", "name"]);
  assert.deepEqual(uses, ["actions/checkout@v4", "pnpm/action-setup@v4", "actions/setup-node@v4"]);
  assert.deepEqual(runs, ["pnpm install --frozen-lockfile", "pnpm gate"]);
});

test("CI's step settings are only the ones the gate needs", () => {
  assert.deepEqual(withs, [
    "fetch-depth: 0",
    "node-version: 22",
    "cache: pnpm",
    "DS_GATE_BASE: ${{ github.event.pull_request.base.sha }}",
  ]);
});

test("the gate lists every check CI used to run one by one, and the API manifests", () => {
  const commands = STEPS.map(([, command]) => command).join("\n");
  for (const required of [
    "node scripts/check-env.mjs",
    "pnpm lint",
    "pnpm format:check",
    "node scripts/check-changeset.mjs",
    "pnpm tokens:check",
    "pnpm scripts:test",
    "pnpm demos:check",
    "pnpm exec turbo run build test typecheck check",
    "pnpm api:check",
    "pnpm api:report:check",
    "pnpm api:runtime-check",
    "pnpm --filter @design-system/core run smoke",
    "pnpm --filter @design-system/svelte run smoke",
    "pnpm --filter @design-system/vue run smoke",
    "pnpm consumers:check",
    "pnpm size",
  ]) {
    assert.ok(commands.includes(required), required);
  }
});

test("step names are unique, so --from is unambiguous", () => {
  const names = STEPS.map(([name]) => name);
  assert.equal(new Set(names).size, names.length);
});
