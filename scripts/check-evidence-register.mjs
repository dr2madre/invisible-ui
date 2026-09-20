#!/usr/bin/env node
// The claim and evidence register (docs/evidence-register.md) is only worth
// as much as its citations. This reads every file path and every "N tests in
// <path>" count out of it and checks both against the repository.
//
//   node scripts/check-evidence-register.mjs
//
// It cannot tell whether a test asserts what its row says: a reviewer does
// that. It can tell that the file is there and that the number is right,
// which is what goes stale on its own.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export const REGISTER = "docs/evidence-register.md";

/** How many tests a vitest or node:test file declares. */
export function countTests(source) {
  return [...source.matchAll(/^\s*(?:it|test)(?:\.\w+)*\s*\(/gm)].length;
}

/** Paths a row cites, as `path/like/this.ext` inside backticks. */
export function citedPaths(register) {
  const paths = new Set();
  for (const [, path] of register.matchAll(/`([\w./-]+\.(?:ts|tsx|mjs|js|yml|svelte|md|mdx))`/g)) {
    paths.add(path);
  }
  return [...paths].sort();
}

/** Every "N tests in `path`" the register claims. */
export function citedCounts(register) {
  const counts = [];
  for (const [, n, path] of register.matchAll(/(\d+) tests in `([\w./-]+)`/g)) {
    counts.push({ path, claimed: Number(n) });
  }
  return counts;
}

/** @returns {string[]} the problems, empty when the register is accurate */
export function checkRegister(root) {
  const file = resolve(root, REGISTER);
  if (!existsSync(file)) return [`${REGISTER} is missing.`];
  const register = readFileSync(file, "utf8");
  const problems = [];

  for (const path of citedPaths(register)) {
    if (!existsSync(resolve(root, path))) {
      problems.push(`${REGISTER} cites ${path}, which does not exist.`);
    }
  }
  for (const { path, claimed } of citedCounts(register)) {
    const full = resolve(root, path);
    if (!existsSync(full)) continue; // already reported above
    const actual = countTests(readFileSync(full, "utf8"));
    if (actual !== claimed) {
      problems.push(`${REGISTER} says ${claimed} tests in ${path}; it declares ${actual}.`);
    }
  }
  // A row that waits on a pull request has to say the claim is not made yet.
  for (const line of register.split("\n")) {
    if (!/held once #\d+ lands/.test(line)) continue;
    if (!/not claimed before then|not claimed/.test(line)) {
      problems.push(
        `${REGISTER} has a row waiting on a pull request without saying the claim is not made before then: ${line.slice(0, 60)}…`,
      );
    }
  }
  return problems;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const problems = checkRegister(root);
  if (problems.length > 0) {
    for (const problem of problems) console.error(problem);
    process.exit(1);
  }
  console.log(`${REGISTER}: every cited file exists and every test count matches.`);
}
