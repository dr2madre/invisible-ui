import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkoutFingerprint, verifyBuildId } from "./build-id.mjs";
import { hashInputs } from "./source-hash.mjs";

// The rules a served stamp is held to. `expected` is what this checkout
// computes for itself; `served` is what the server on the port answered.
const expected = { site: "docs", checkout: "abc", head: "1111111aaaaaaa", inputs: "h1" };
const same = { ...expected, builtAt: "2026-01-01T00:00:00.000Z" };

test("a stamp from this checkout, commit and sources passes", () => {
  assert.equal(verifyBuildId(same, expected), null);
});

test("a server of another checkout is refused, and the escape hatch does not help", () => {
  const served = { ...same, checkout: "other" };
  assert.match(verifyBuildId(served, expected), /another checkout/);
  assert.match(verifyBuildId(served, expected, { allowStale: true }), /another checkout/);
});

test("a build from a different commit is refused, whatever the escape hatch says", () => {
  const served = { ...same, head: "2222222bbbbbbb" };
  assert.match(verifyBuildId(served, expected), /commit 2222222, HEAD is 1111111/);
  assert.match(verifyBuildId(served, expected, { allowStale: true }), /commit/);
});

test("a build from other sources is refused, unless staleness is allowed knowingly", () => {
  const served = { ...same, inputs: "h2" };
  assert.match(verifyBuildId(served, expected), /changed after the served build/);
  assert.equal(verifyBuildId(served, expected, { allowStale: true }), null);
});

test("no stamp at all is refused", () => {
  assert.match(verifyBuildId(null, expected), /no build stamp/);
  assert.match(verifyBuildId("<html>", expected), /no build stamp/);
});

test("the same content with a different timestamp is the same build", () => {
  const served = { ...same, builtAt: "2030-12-31T23:59:59.000Z" };
  assert.equal(verifyBuildId(served, expected), null);
});

test("the checkout fingerprint names no path", () => {
  const fp = checkoutFingerprint("/Users/someone/work/invisible-ui");
  assert.match(fp, /^[0-9a-f]{16}$/);
  assert.doesNotMatch(fp, /someone|invisible/);
});

// The inputs hash: content, not time.
function tree() {
  const root = mkdtempSync(join(tmpdir(), "inputs-"));
  mkdirSync(join(root, "site/src"), { recursive: true });
  mkdirSync(join(root, "site/node_modules/x"), { recursive: true });
  writeFileSync(join(root, "site/src/a.ts"), "a");
  writeFileSync(join(root, "site/src/a.test.ts"), "test");
  writeFileSync(join(root, "site/node_modules/x/index.js"), "dep");
  writeFileSync(join(root, "site/index.html"), "<html>");
  return root;
}
const ENTRIES = ["site/src", "site/index.html", "site/missing.css"];

test("touching every file leaves the inputs hash unchanged", () => {
  const root = tree();
  const before = hashInputs(root, ENTRIES);
  const later = new Date(Date.now() + 60_000);
  for (const f of ["site/src/a.ts", "site/index.html"]) utimesSync(join(root, f), later, later);
  assert.equal(hashInputs(root, ENTRIES), before);
  rmSync(root, { recursive: true, force: true });
});

test("a changed byte changes the hash; a test file or an installed dependency does not", () => {
  const root = tree();
  const before = hashInputs(root, ENTRIES);
  writeFileSync(join(root, "site/src/a.test.ts"), "other test");
  writeFileSync(join(root, "site/node_modules/x/index.js"), "other dep");
  assert.equal(hashInputs(root, ENTRIES), before);
  writeFileSync(join(root, "site/src/a.ts"), "b");
  assert.notEqual(hashInputs(root, ENTRIES), before);
  rmSync(root, { recursive: true, force: true });
});

test("an entry that appears later changes the hash", () => {
  const root = tree();
  const before = hashInputs(root, ENTRIES);
  writeFileSync(join(root, "site/missing.css"), "");
  assert.notEqual(hashInputs(root, ENTRIES), before);
  rmSync(root, { recursive: true, force: true });
});
