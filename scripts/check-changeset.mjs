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

// Where this branch left the base. The file list and the file contents have
// to be read at the same commit: `main` moving on after the branch point
// would otherwise blame this change for someone else's edit, or hide one of
// its own behind an identical edit already on the base.
const mergeBase = execFileSync("git", ["merge-base", base, "HEAD"], {
  encoding: "utf8",
}).trim();

// Name and status together: a deleted changeset must not satisfy the gate.
const entries = execFileSync("git", ["diff", "--name-status", mergeBase, "HEAD"], {
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

// Which packages the touched files speak for. An API report speaks for its
// package; a prop manifest for the frameworks whose section changed; a token
// for every adapter that ships it. The changesets added must name them all.
const show = (ref, file) => {
  try {
    // A file this change adds is absent from the base: that is an answer,
    // not a failure, so git's complaint about it stays off the log.
    return JSON.parse(
      execFileSync("git", ["show", `${ref}:${file}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
  } catch {
    return null;
  }
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const required = new Set();
for (const file of touched) {
  const api = /^packages\/docs\/src\/generated\/api\/([\w-]+)\.json$/.exec(file);
  if (api) {
    required.add(`@design-system/${api[1]}`);
    continue;
  }
  const before = show(mergeBase, file);
  const after = show("HEAD", file);
  if (/\/props\//.test(file)) {
    const frameworks = new Set([
      ...Object.keys(before?.frameworks ?? {}),
      ...Object.keys(after?.frameworks ?? {}),
    ]);
    for (const framework of frameworks) {
      if (!same(before?.frameworks?.[framework], after?.frameworks?.[framework])) {
        required.add(`@design-system/${framework}`);
      }
    }
    continue;
  }
  // The token registry: every adapter a changed token ships in.
  const byName = (registry) =>
    new Map(
      [...(registry?.tokens ?? []), ...(registry?.componentTokens ?? [])].map((t) => [t.name, t]),
    );
  const was = byName(before);
  const is = byName(after);
  for (const name of new Set([...was.keys(), ...is.keys()])) {
    if (same(was.get(name), is.get(name))) continue;
    for (const adapter of (is.get(name) ?? was.get(name))?.adapters ?? []) {
      required.add(`@design-system/${adapter}`);
    }
  }
}

// Only a changeset ADDED by this change counts, and it has to say something:
// an empty file, or deleting someone else's changeset, satisfies nothing.
const added = entries.filter(
  (entry) =>
    entry.status === "A" &&
    /^\.changeset\/.+\.md$/.test(entry.file) &&
    !entry.file.endsWith("README.md"),
);
const named = new Set();
const substantial = added.filter((entry) => {
  let text;
  try {
    text = readFileSync(entry.file, "utf8");
  } catch {
    return false;
  }
  // Body text beyond the --- frontmatter block. An empty changeset describes
  // nothing, so the packages it lists are not spoken for either.
  const body = text.replace(/^---[\s\S]*?---/, "").trim();
  if (body.length === 0) return false;
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
  for (const line of frontmatter.split("\n")) {
    const pkg = /^"?(@design-system\/[\w-]+)"?\s*:/.exec(line.trim());
    if (pkg) named.add(pkg[1]);
  }
  return true;
});
if (substantial.length > 0) {
  const missing = [...required].filter((pkg) => !named.has(pkg)).sort();
  if (missing.length > 0) {
    console.error("The changeset names other packages than the ones whose contract changed:");
    for (const pkg of missing) console.error(`  - ${pkg} changed and is not named`);
    console.error(`Named: ${[...named].sort().join(", ") || "(none)"}.`);
    process.exit(1);
  }
  console.log(
    `Contract change carries a changeset (${substantial.map((entry) => entry.file).join(", ")}) naming ${[...required].sort().join(", ") || "no package"}.`,
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
