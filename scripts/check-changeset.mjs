#!/usr/bin/env node
// A pull request that changes the public contract must say so: when the diff
// against the base touches an API report, a prop manifest or the token
// registry, the same diff must add a changeset describing the change
// (docs/api-stability.md). Run with the base commit as the only argument:
//
//   node scripts/check-changeset.mjs <base-sha-or-ref>

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = process.argv[2];
if (!base) {
  console.error("usage: node scripts/check-changeset.mjs <base-sha-or-ref>");
  process.exit(2);
}

// Name and status together: a deleted changeset must not satisfy the gate.
const entries = execFileSync("git", ["diff", "--name-status", `${base}...HEAD`], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [status, ...names] = line.split("\t");
    // A rename line carries two names; the new one is last.
    return { status: status[0], file: names.at(-1) };
  });
const diff = entries.map((entry) => entry.file);

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

// Only a changeset ADDED by this change counts, and it has to say something:
// an empty file, or deleting someone else's changeset, satisfies nothing.
const added = entries.filter(
  (entry) =>
    entry.status === "A" &&
    /^\.changeset\/.+\.md$/.test(entry.file) &&
    !entry.file.endsWith("README.md"),
);
const substantial = added.filter((entry) => {
  try {
    const text = readFileSync(entry.file, "utf8");
    // Body text beyond the --- frontmatter block.
    const body = text.replace(/^---[\s\S]*?---/, "").trim();
    return body.length > 0;
  } catch {
    return false;
  }
});
if (substantial.length > 0) {
  console.log(
    `Contract change carries a changeset (${substantial.map((entry) => entry.file).join(", ")}).`,
  );
  process.exit(0);
}
if (added.length > 0) {
  console.error("The changeset added here is empty; describe the change (docs/api-stability.md).");
  process.exit(1);
}

console.error("This change alters the public contract but adds no changeset:");
for (const file of touched) console.error(`  - ${file}`);
console.error("Add one with `pnpm changeset` and describe the change per docs/api-stability.md.");
process.exit(1);
