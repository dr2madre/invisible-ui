import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const map = read("packages/tokens/migration-iui.json");
const registry = read("packages/docs/src/generated/tokens/registry.json");
const published = new Set([
  ...registry.tokens.map((token) => token.name),
  ...registry.componentTokens.map((token) => token.name),
]);

test("each entry of the --ds- to --iui- map changes the prefix only", () => {
  const seen = new Set();
  for (const entry of map.entries) {
    assert.match(entry.from, /^--ds-[\w-]+$/);
    assert.equal(entry.to, `--iui-${entry.from.slice("--ds-".length)}`);
    assert.ok(!seen.has(entry.from), `${entry.from} is listed twice`);
    seen.add(entry.from);
  }
});

test("each name in the map is still published, unless the entry says it was retired", () => {
  for (const entry of map.entries) {
    if (entry.retired) continue;
    assert.ok(published.has(entry.to), `${entry.to} is no longer in the token registry`);
  }
});

// Files that keep the --ds- spelling on purpose: records of what shipped
// before the rename, and the material that explains the rename.
const KEEP_OLD_PREFIX = [
  ":!**/CHANGELOG.md",
  ":!.changeset/pre/**",
  ":!.changeset/iui-css-custom-properties.md",
  ":!docs/adr/**",
  ":!docs/done/**",
  ":!docs/proposals/**",
  ":!report/**",
  ":!docs/sidebar-spec.md",
  ":!docs/tokens.md",
  ":!packages/docs/src/content/docs/presentation/css-prefix-migration.mdx",
  ":!packages/tokens/migration-v2.json",
  ":!packages/tokens/migration-iui.json",
  ":!scripts/css-prefix-migration.test.mjs",
  ":!scripts/prepare-token-reform.mjs",
  ":!scripts/token-migration-map.mjs",
];

test("no other tracked file uses the --ds- prefix", () => {
  let found = "";
  try {
    found = execFileSync("git", ["grep", "-n", "-e", "--ds-", "--", ".", ...KEEP_OLD_PREFIX], {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
    });
  } catch (error) {
    // git grep exits with 1 when nothing matches; anything else is a real error.
    if (error.status !== 1) throw error;
  }
  assert.equal(found, "");
});
