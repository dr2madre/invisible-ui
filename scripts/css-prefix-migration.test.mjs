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

test("the published sources declare and read no --ds- custom property", () => {
  const sources = [
    "packages/svelte/src",
    "packages/vue/src",
    "packages/react/src",
    "packages/elements/src",
  ];
  let found = "";
  try {
    found = execFileSync("git", ["grep", "-n", "-e", "--ds-", "--", ...sources], {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
    });
  } catch (error) {
    // git grep exits with 1 when nothing matches.
    if (error.status !== 1) throw error;
  }
  assert.equal(found, "");
});
