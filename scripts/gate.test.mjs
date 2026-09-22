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
// From `jobs:` to the next top-level key, or the end of the file.
const jobsStart = ci.indexOf("\njobs:\n") + 1;
const nextTop = ci.slice(jobsStart + 6).search(/^\w/m);
const jobs = nextTop === -1 ? ci.slice(jobsStart) : ci.slice(jobsStart, jobsStart + 6 + nextTop);
const jobNames = [...jobs.matchAll(/^ {2}([\w-]+):\s*$/gm)].map((m) => m[1]);
const jobKeys = [...jobs.matchAll(/^ {4}([\w-]+):/gm)].map((m) => m[1]);
const stepKeys = [...jobs.matchAll(/^ {6}- ([\w-]+):/gm)].map((m) => m[1]);
// Every key inside a step: an `if:`, `continue-on-error:`, `shell:` or
// `working-directory:` here would change what runs or whether a red gate
// counts, so the whole set is held.
const stepInnerKeys = [...jobs.matchAll(/^ {8}([\w-]+):/gm)].map((m) => m[1]);
const uses = [...jobs.matchAll(/^\s*-?\s*uses:\s*(.+)$/gm)].map((m) => m[1].trim());
const runs = [...jobs.matchAll(/^\s*-?\s*run:\s*(.+)$/gm)].map((m) => m[1].trim());
const withs = [...jobs.matchAll(/^ {10}([\w-]+):\s*(.+)$/gm)].map((m) => `${m[1]}: ${m[2].trim()}`);

// A step written as a flow mapping (`- { run: ... }`) has no key at column
// eight; counting list items under `steps:` catches it. Above `jobs:`, only
// the workflow's name, triggers and permissions may appear: a workflow-level
// `env:` would reach the gate through the tools it drives.
test("the workflow has five step items and nothing above jobs but name, triggers and permissions", () => {
  assert.equal(jobs.match(/^ {6}- /gm)?.length, 5);
  assert.deepEqual(
    [...ci.matchAll(/^(\w[\w-]*):/gm)].map((m) => m[1]),
    ["name", "on", "permissions", "jobs"],
  );
});

test("CI has one job, on one runner, with steps and nothing else", () => {
  assert.deepEqual(jobNames, ["verify"]);
  assert.deepEqual(jobKeys, ["runs-on", "steps"]);
  assert.match(jobs, /^ {4}runs-on: ubuntu-latest$/m);
});

test("CI's steps are checkout, pnpm, Node, install, gate; nothing else", () => {
  assert.deepEqual(stepKeys, ["uses", "name", "name", "name", "name"]);
  assert.deepEqual(uses, ["actions/checkout@v4", "pnpm/action-setup@v4", "actions/setup-node@v4"]);
  assert.deepEqual(runs, ["pnpm install --frozen-lockfile", "pnpm gate"]);
  assert.deepEqual(stepInnerKeys, ["with", "uses", "uses", "with", "run", "run", "env"]);
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
    "pnpm audit",
    "pnpm lint",
    "pnpm format:check",
    "node scripts/check-changeset.mjs",
    "pnpm tokens:check",
    "pnpm scripts:test",
    "pnpm demos:check",
    "pnpm exec turbo run build test typecheck check",
    "pnpm typecheck:e2e",
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

test("the gate refuses names and text that mention a tool", () => {
  const names = STEPS.map(([name]) => name);
  assert.ok(
    names.includes("no-tool-traces"),
    "the gate has to check for tool traces: the rule is written in CONTRIBUTING.md and in CLAUDE.md, and a session that remembers neither still has to obey it",
  );
});
