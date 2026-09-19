import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_INPUTS,
  buildIdPlugin,
  checkoutFingerprint,
  parseStamp,
  verifyBuildId,
} from "./build-id.mjs";
import { hashInputs } from "./source-hash.mjs";

// The rules a served stamp is held to. `expected` is what this checkout
// computes for itself; `served` is what the server on the port answered.
const expected = { site: "docs", checkout: "abc", head: "1111111aaaaaaa", inputs: "h1" };
const same = { ...expected, builtAt: "2026-01-01T00:00:00.000Z" };

test("a stamp from this checkout and these sources passes", () => {
  assert.equal(verifyBuildId(same, expected), null);
});

test("a server of another checkout is refused, and the escape hatch does not help", () => {
  const served = { ...same, checkout: "other" };
  assert.match(verifyBuildId(served, expected), /another checkout/);
  assert.match(verifyBuildId(served, expected, { allowStale: true }), /another checkout/);
});

test("the other site's build on this port is refused, whatever the escape hatch says", () => {
  const served = { ...same, site: "vue-example" };
  assert.match(verifyBuildId(served, expected), /serves the vue-example build, not docs/);
  assert.match(verifyBuildId(served, expected, { allowStale: true }), /vue-example build/);
});

test("a build from other sources is refused and names the commits, unless staleness is allowed knowingly", () => {
  const served = { ...same, inputs: "h2", head: "2222222bbbbbbb" };
  assert.match(
    verifyBuildId(served, expected),
    /changed after the served build \(built at 2222222, HEAD is 1111111\)/,
  );
  assert.match(verifyBuildId(served, expected), /turbo run build --force/);
  assert.equal(verifyBuildId(served, expected, { allowStale: true }), null);
});

// Turbo may restore a build made at an older commit. If nothing the site is
// built from changed since, that build is this build; a refusal here would
// demand a rebuild that the cache would answer with the same stamp, forever.
test("a build from another commit with the same inputs is the same build", () => {
  const served = { ...same, head: "2222222bbbbbbb" };
  assert.equal(verifyBuildId(served, expected), null);
});

test("no stamp at all is refused", () => {
  assert.match(verifyBuildId(null, expected), /no build stamp/);
  assert.match(verifyBuildId("<html>", expected), /no build stamp/);
});

test("the same content with a different timestamp is the same build", () => {
  const served = { ...same, builtAt: "2030-12-31T23:59:59.000Z" };
  assert.equal(verifyBuildId(served, expected), null);
});

// A site with no stamp answers with its 404 page, or with index.html under
// Vite's single-page fallback: HTML, never a stamp.
test("an HTML answer, or JSON that is not a stamp, reads as no stamp", () => {
  assert.equal(parseStamp("<!doctype html><html></html>"), null);
  assert.equal(parseStamp('{"hello":1}'), null);
  assert.equal(parseStamp("not json"), null);
  assert.deepEqual(parseStamp(JSON.stringify(same)), same);
});

test("the checkout fingerprint names no path and follows the real path", () => {
  const dir = mkdtempSync(join(tmpdir(), "fp-"));
  mkdirSync(join(dir, "real"));
  symlinkSync(join(dir, "real"), join(dir, "link"));
  const fp = checkoutFingerprint(join(dir, "real"));
  assert.match(fp, /^[0-9a-f]{16}$/);
  assert.doesNotMatch(fp, /real|fp-/);
  assert.equal(checkoutFingerprint(join(dir, "link")), fp);
  rmSync(dir, { recursive: true, force: true });
});

test("the Vite plugin writes beside an absolute outDir, not under the project root", () => {
  const out = mkdtempSync(join(tmpdir(), "out-"));
  const plugin = buildIdPlugin("vue-example", fileURLToPath(new URL("..", import.meta.url)));
  plugin.configResolved({ root: "/somewhere/else", build: { outDir: out } });
  plugin.closeBundle();
  assert.ok(existsSync(join(out, ".build-id.json")));
  rmSync(out, { recursive: true, force: true });
});

// A renamed input would be hashed as "absent" on both sides and drop out of
// the guard without a word. Built outputs are absent before a build and are
// left out here.
test("every listed source input exists in the repository", () => {
  const repo = fileURLToPath(new URL("..", import.meta.url));
  for (const entries of Object.values(SITE_INPUTS)) {
    for (const entry of entries) {
      if (entry.includes("/dist")) continue;
      assert.ok(existsSync(join(repo, entry)), entry);
    }
  }
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
