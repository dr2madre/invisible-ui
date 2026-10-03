// Holds the dependency audit exceptions to what SECURITY.md documents: every
// advisory in `pnpm.auditConfig.ignoreGhsas` has a row there, and no shipped
// package reaches the excepted package in production.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const ignored = manifest.pnpm?.auditConfig?.ignoreGhsas ?? [];
const security = readFileSync(new URL("SECURITY.md", root), "utf8");

const SHIPPED = ["core", "svelte", "vue", "react", "elements"];

// One table row per exception: | [GHSA-…](…) | `package` … |
const rows = [...security.matchAll(/^\| \[(GHSA-[\w-]+)\]\([^)]*\) \| `([^`]+)`/gm)].map(
  ([, ghsa, pkg]) => ({ ghsa, pkg }),
);

test("every excepted advisory is documented in SECURITY.md, and nothing more", () => {
  assert.deepEqual([...ignored].sort(), rows.map((row) => row.ghsa).sort());
});

test("no shipped package depends on an excepted package in production", () => {
  for (const { pkg } of rows) {
    for (const name of SHIPPED) {
      const out = execFileSync(
        "pnpm",
        ["--filter", `@design-system/${name}`, "why", pkg, "--prod", "--json"],
        { cwd: root, encoding: "utf8" },
      ).trim();
      const found = out ? JSON.parse(out) : [];
      assert.equal(found.length, 0, `@design-system/${name} reaches ${pkg} in production`);
    }
  }
});
