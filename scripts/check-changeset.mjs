#!/usr/bin/env node
// A pull request that changes the public contract must say so: when the diff
// against the base touches an API report, a prop manifest or the token
// registry, the same diff must add a changeset describing the change
// (docs/api-stability.md). Run with the base commit as the only argument:
//
//   node scripts/check-changeset.mjs <base-sha-or-ref>

import { execFileSync } from "node:child_process";

const base = process.argv[2];
if (!base) {
  console.error("usage: node scripts/check-changeset.mjs <base-sha-or-ref>");
  process.exit(2);
}

const diff = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);

const CONTRACT = [
  /^packages\/docs\/src\/generated\/api\//,
  /^packages\/docs\/src\/generated\/props\//,
  /^packages\/docs\/src\/generated\/tokens\/registry\.json$/,
];

const touched = diff.filter((file) => CONTRACT.some((pattern) => pattern.test(file)));
if (touched.length === 0) {
  console.log("No public-contract files changed; no changeset needed.");
  process.exit(0);
}

const changesets = diff.filter(
  (file) => /^\.changeset\/.+\.md$/.test(file) && !file.endsWith("README.md"),
);
if (changesets.length > 0) {
  console.log(`Contract change carries a changeset (${changesets.join(", ")}).`);
  process.exit(0);
}

console.error("This change alters the public contract but adds no changeset:");
for (const file of touched) console.error(`  - ${file}`);
console.error("Add one with `pnpm changeset` and describe the change per docs/api-stability.md.");
process.exit(1);
