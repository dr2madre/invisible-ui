#!/usr/bin/env node
// The whole quality gate, locally and in CI, from one list.
//
//   pnpm gate                # every step
//   pnpm gate --from size    # resume at one step
//   pnpm gate --list         # print the steps
//
// The changeset step compares against origin/main when that ref exists; CI
// passes the pull request's base commit in DS_GATE_BASE, and an empty value
// (a manual run with no pull request) skips that step. Another ref:
// DS_GATE_BASE=<ref> pnpm gate.
//
// scripts/gate.test.mjs holds .github/workflows/ci.yml to this same entry
// point, so a check cannot exist in one place and not the other.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const hasRef = (ref) =>
  spawnSync("git", ["rev-parse", "--verify", "--quiet", ref], { cwd: root }).status === 0;
const base =
  process.env.DS_GATE_BASE === undefined
    ? hasRef("origin/main")
      ? "origin/main"
      : ""
    : process.env.DS_GATE_BASE;

/** Steps that run only when their input exists; today, the changeset base. */
const SKIPPED = new Set(base ? [] : ["changeset"]);

/** Name, then the command. Order matters: cheap and independent first. */
export const STEPS = [
  ["env", "node scripts/check-env.mjs"],
  ["lint", "pnpm lint"],
  ["format", "pnpm format:check"],
  ["changeset", `node scripts/check-changeset.mjs ${base || "<base>"}`],
  ["tokens", "pnpm tokens:check"],
  ["scripts-tests", "pnpm scripts:test"],
  ["demos", "pnpm demos:check"],
  ["build-test-typecheck-check", "pnpm exec turbo run build test typecheck check"],
  ["api-manifests", "pnpm api:check"],
  ["api-report", "pnpm api:report:check"],
  ["runtime-exports", "pnpm api:runtime-check"],
  [
    "smoke",
    "pnpm --filter @design-system/core run smoke && pnpm --filter @design-system/svelte run smoke && pnpm --filter @design-system/vue run smoke",
  ],
  ["consumers", "pnpm consumers:check"],
  ["size", "pnpm size"],
];

// Only run when this file is the entry point; the test imports STEPS.
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!isMain) {
  // imported for STEPS
} else {
  main();
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--list")) {
    for (const [name, command] of STEPS)
      console.log(
        `${name.padEnd(28)} ${SKIPPED.has(name) ? "(skipped: no base commit)" : command}`,
      );
    process.exit(0);
  }
  const from = args[args.indexOf("--from") + 1];
  let start = args.includes("--from") ? STEPS.findIndex(([name]) => name === from) : 0;
  if (start === -1) {
    console.error(`Unknown step "${from}". Steps: ${STEPS.map(([n]) => n).join(", ")}`);
    process.exit(2);
  }

  const results = [];
  for (const [name, command] of STEPS.slice(start)) {
    if (SKIPPED.has(name)) {
      console.log(`\n▶ ${name}: skipped (no base commit: set DS_GATE_BASE=<ref>)`);
      results.push([name, "skipped", "0"]);
      continue;
    }
    const began = Date.now();
    console.log(`\n▶ ${name}: ${command}`);
    const { status, signal } = spawnSync(command, { cwd: root, stdio: "inherit", shell: true });
    const seconds = ((Date.now() - began) / 1000).toFixed(0);
    results.push([name, status === 0 ? "ok" : `FAILED (${status ?? signal})`, seconds]);
    if (status !== 0) {
      console.error(`\n✖ ${name} failed. Fix it, then resume: pnpm gate --from ${name}`);
      break;
    }
  }
  console.log("\nGate summary");
  for (const [name, outcome, seconds] of results)
    console.log(`  ${name.padEnd(28)} ${outcome.padEnd(12)} ${seconds}s`);
  const failed = results.some(([, outcome]) => outcome.startsWith("FAILED"));
  const notRun = STEPS.length - start - results.length;
  if (notRun) console.log(`  ${notRun} step(s) not run.`);
  process.exit(failed ? 1 : 0);
}
