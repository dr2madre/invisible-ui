// Holds the dependency audit exceptions and the patched dependencies to what
// SECURITY.md documents: every advisory in `pnpm.auditConfig.ignoreGhsas` has
// a row in "Dependency audit exceptions", no shipped package reaches an
// excepted package in production, and every `pnpm.patchedDependencies` entry
// has a row in "Patched dependencies".
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const ignored = manifest.pnpm?.auditConfig?.ignoreGhsas ?? [];
const patched = Object.keys(manifest.pnpm?.patchedDependencies ?? {});
const security = readFileSync(new URL("SECURITY.md", root), "utf8");

const SHIPPED = ["core", "svelte", "vue", "react", "elements"];

// The text of one "## " section of SECURITY.md, up to the next one.
function section(title) {
  const start = security.indexOf(`\n## ${title}\n`);
  assert.notEqual(start, -1, `SECURITY.md has no "${title}" section`);
  const end = security.indexOf("\n## ", start + 1);
  return security.slice(start, end === -1 ? undefined : end);
}

// One table row per exception: | [GHSA-…](…) | `package` … |
const rows = [
  ...section("Dependency audit exceptions").matchAll(
    /^\| \[(GHSA-[\w-]+)\]\([^)]*\) \| `([^`]+)`/gm,
  ),
].map(([, ghsa, pkg]) => ({ ghsa, pkg }));

// One table row per patch: | `package@version` | [GHSA-…](…) …
const patchRows = [
  ...section("Patched dependencies").matchAll(/^\| `([^`]+)` \| \[GHSA-[\w-]+\]/gm),
].map(([, spec]) => spec);

test("every excepted advisory is documented in SECURITY.md, and nothing more", () => {
  assert.deepEqual([...ignored].sort(), rows.map((row) => row.ghsa).sort());
});

test("every patched dependency is documented in SECURITY.md, and nothing more", () => {
  assert.deepEqual([...patched].sort(), [...patchRows].sort());
});

test("no shipped package depends on an excepted package in production", () => {
  for (const { pkg } of rows) {
    for (const name of SHIPPED) {
      const out = execFileSync(
        "pnpm",
        ["--filter", `@invisible-ui/${name}`, "why", pkg, "--prod", "--json"],
        { cwd: root, encoding: "utf8" },
      ).trim();
      const found = out ? JSON.parse(out) : [];
      assert.equal(found.length, 0, `@invisible-ui/${name} reaches ${pkg} in production`);
    }
  }
});
