import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkCoreDist, assertCoreDist } from "./check-core-dist.mjs";
import { hashPackageSources } from "./source-hash.mjs";

// A miniature `core/`: one source, the build inputs the hash covers, and a
// dist whose build info this test writes by hand.
function fixture(parent = tmpdir()) {
  const root = mkdtempSync(join(parent, "core-dist-"));
  const core = join(root, "core");
  mkdirSync(join(core, "src"), { recursive: true });
  mkdirSync(join(core, "scripts"), { recursive: true });
  mkdirSync(join(core, "dist"), { recursive: true });
  writeFileSync(join(core, "src/index.ts"), "export const a = 1;\n");
  writeFileSync(join(core, "src/index.test.ts"), "test\n");
  writeFileSync(join(core, "package.json"), "{}\n");
  writeFileSync(join(core, "tsup.config.ts"), "export default {};\n");
  writeFileSync(join(core, "tsconfig.json"), "{}\n");
  writeFileSync(join(root, "tsconfig.base.json"), "{}\n");
  writeFileSync(join(root, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
  writeFileSync(join(core, "scripts/clean-dist.mjs"), "");
  writeFileSync(join(core, "scripts/patch-esm-specifiers.mjs"), "");
  writeFileSync(join(core, "dist/index.js"), "export const a = 1;\n");
  const record = () =>
    writeFileSync(
      join(core, "dist/.build-info.json"),
      JSON.stringify({ sourceHash: hashPackageSources(root, "core") }),
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

test("the build config, the tsconfigs and the lockfile count", () => {
  for (const [rel, content] of [
    ["core/tsup.config.ts", "export default { minify: true };\n"],
    ["core/tsconfig.json", '{ "compilerOptions": { "strict": true } }\n'],
    ["tsconfig.base.json", '{ "compilerOptions": { "lib": ["es2023"] } }\n'],
    ["pnpm-lock.yaml", "lockfileVersion: 9\n\npackages:\n  tsup@8.5.2: {}\n"],
    ["core/package.json", '{ "name": "x" }\n'],
    ["core/scripts/patch-esm-specifiers.mjs", "// changed\n"],
  ]) {
    const f = fixture();
    f.record();
    writeFileSync(join(f.root, rel), content);
    assert.match(checkCoreDist(f.root), /other sources/, rel);
    f.done();
  }
});

// What the checkout is called must not change what is hashed: a repository
// cloned under a directory named `src` once dropped every extra input.
test("a checkout under a directory named src still counts every extra input", () => {
  const parent = mkdtempSync(join(tmpdir(), "home-"));
  mkdirSync(join(parent, "src"));
  for (const [rel, content] of [
    ["core/package.json", '{ "name": "y" }\n'],
    ["pnpm-lock.yaml", "lockfileVersion: 9\n\npackages: {}\n"],
    ["core/tsup.config.ts", "export default { treeshake: false };\n"],
    ["core/tsconfig.json", '{ "compilerOptions": { "strict": false } }\n'],
    ["tsconfig.base.json", '{ "compilerOptions": { "target": "es2022" } }\n'],
    ["core/scripts/patch-esm-specifiers.mjs", "// rewritten\n"],
    ["core/scripts/clean-dist.mjs", "// rewritten\n"],
  ]) {
    const f = fixture(join(parent, "src"));
    assert.match(f.root, /\/src\//);
    f.record();
    writeFileSync(join(f.root, rel), content);
    assert.match(checkCoreDist(f.root), /other sources/, rel);
    f.done();
  }
  rmSync(parent, { recursive: true, force: true });
});

// The build records the hash under a pending name and renames it only after
// it has succeeded. A build that failed or was interrupted leaves the pending
// file, which is not a stamp.
test("a failed build's dist, with only a pending stamp, is refused", () => {
  const f = fixture();
  writeFileSync(
    join(f.core, "dist/.build-info.pending.json"),
    JSON.stringify({ sourceHash: hashPackageSources(f.root, "core") }),
  );
  assert.match(checkCoreDist(f.root), /no build info/);
  f.done();
});

test("a pending stamp beside a canonical one changes nothing", () => {
  const f = fixture();
  f.record();
  writeFileSync(join(f.core, "dist/.build-info.pending.json"), '{ "sourceHash": "stale" }');
  assert.equal(checkCoreDist(f.root), null);
  f.done();
});

test("a missing input is reported with the remedy, not a stack", () => {
  const f = fixture();
  f.record();
  rmSync(join(f.core, "tsconfig.json"));
  assert.match(checkCoreDist(f.root), /other sources|could not be read/);
  f.done();
});

// The hash keeps what tsup compiles. If tsup's entry ever widens (.tsx, .mts),
// this fails until the hash follows.
test("the hash's inclusion rule matches tsup's entry", () => {
  const repo = fileURLToPath(new URL("..", import.meta.url));
  const tsup = readFileSync(join(repo, "core/tsup.config.ts"), "utf8");
  assert.match(tsup, /entry: \["src\/\*\*\/\*\.ts", "!src\/\*\*\/\*\.test\.ts"\]/);
});

test("the real core/dist, when built, passes the guard", () => {
  const repo = fileURLToPath(new URL("..", import.meta.url));
  if (!existsSync(join(repo, "core/dist/.build-info.json"))) return;
  assert.equal(checkCoreDist(repo), null);
});

test("a dist without build info, or no dist at all, is refused", () => {
  const f = fixture();
  assert.match(checkCoreDist(f.root), /no build info/);
  rmSync(join(f.core, "dist"), { recursive: true });
  assert.match(checkCoreDist(f.root), /missing/);
  f.done();
});

test("assertCoreDist throws, unless the escape hatch is exactly 1", () => {
  const f = fixture();
  assert.throws(() => assertCoreDist(f.root), /\[core-dist\]/);
  const before = process.env.DS_ALLOW_STALE_CORE;
  process.env.DS_ALLOW_STALE_CORE = "0";
  assert.throws(() => assertCoreDist(f.root), /\[core-dist\]/);
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
