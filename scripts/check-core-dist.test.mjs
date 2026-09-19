import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkCoreDist, assertCoreDist } from "./check-core-dist.mjs";
import { hashCoreSources } from "./source-hash.mjs";

// A miniature `core/`: one source, the build inputs the hash covers, and a
// dist whose build info this test writes by hand.
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "core-dist-"));
  const core = join(root, "core");
  mkdirSync(join(core, "src"), { recursive: true });
  mkdirSync(join(core, "scripts"), { recursive: true });
  mkdirSync(join(core, "dist"), { recursive: true });
  writeFileSync(join(core, "src/index.ts"), "export const a = 1;\n");
  writeFileSync(join(core, "src/index.test.ts"), "test\n");
  writeFileSync(join(core, "package.json"), "{}\n");
  writeFileSync(join(core, "tsup.config.ts"), "export default {};\n");
  writeFileSync(join(core, "scripts/clean-dist.mjs"), "");
  writeFileSync(join(core, "scripts/patch-esm-specifiers.mjs"), "");
  writeFileSync(join(core, "dist/index.js"), "export const a = 1;\n");
  const record = () =>
    writeFileSync(
      join(core, "dist/.build-info.json"),
      JSON.stringify({ sourceHash: hashCoreSources(core) }),
    );
  return { root, core, record, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("a dist built from the current sources passes", () => {
  const f = fixture();
  f.record();
  assert.equal(checkCoreDist(f.root), null);
  f.done();
});

test("a source edit after the build is refused, with the rebuild command", () => {
  const f = fixture();
  f.record();
  writeFileSync(join(f.core, "src/index.ts"), "export const a = 2;\n");
  assert.match(checkCoreDist(f.root), /other sources.*pnpm --filter @design-system\/core build/);
  f.done();
});

test("a test file does not count: tests never reach dist", () => {
  const f = fixture();
  f.record();
  writeFileSync(join(f.core, "src/index.test.ts"), "changed test\n");
  assert.equal(checkCoreDist(f.root), null);
  f.done();
});

test("the build config counts", () => {
  const f = fixture();
  f.record();
  writeFileSync(join(f.core, "tsup.config.ts"), "export default { minify: true };\n");
  assert.match(checkCoreDist(f.root), /other sources/);
  f.done();
});

test("a dist without build info, or no dist at all, is refused", () => {
  const f = fixture();
  assert.match(checkCoreDist(f.root), /no build info/);
  rmSync(join(f.core, "dist"), { recursive: true });
  assert.match(checkCoreDist(f.root), /missing/);
  f.done();
});

test("assertCoreDist throws, unless the escape hatch is set", () => {
  const f = fixture();
  assert.throws(() => assertCoreDist(f.root), /\[core-dist\]/);
  const before = process.env.DS_ALLOW_STALE_CORE;
  process.env.DS_ALLOW_STALE_CORE = "1";
  const warn = console.warn;
  let warned = "";
  console.warn = (m) => (warned += m);
  try {
    assert.doesNotThrow(() => assertCoreDist(f.root));
    assert.match(warned, /stale core anyway/);
  } finally {
    console.warn = warn;
    if (before === undefined) delete process.env.DS_ALLOW_STALE_CORE;
    else process.env.DS_ALLOW_STALE_CORE = before;
  }
  f.done();
});
