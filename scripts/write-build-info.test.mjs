import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BUILD_INFO_FILE,
  PENDING_FILE,
  recordPending,
  verifyAndStamp,
} from "./write-build-info.mjs";
import { checkCoreDist } from "./check-core-dist.mjs";
import { hashPackageSources } from "./source-hash.mjs";

// A miniature workspace: one package with the inputs the hash covers, and a
// dist this test fills in by hand to stand for what a bundler would write.
function fixture({ pkgRel = "packages/thing", name = "@design-system/thing", bundles = [] } = {}) {
  const root = mkdtempSync(join(tmpdir(), "build-info-"));
  const pkgDir = join(root, pkgRel);
  mkdirSync(join(pkgDir, "src"), { recursive: true });
  writeFileSync(join(pkgDir, "src/index.ts"), "export const a = 1;\n");
  writeFileSync(join(pkgDir, "package.json"), JSON.stringify({ name, main: "./dist/index.js" }));
  const noExternal = bundles.length ? ` noExternal: ${JSON.stringify(bundles)},` : "";
  writeFileSync(join(pkgDir, "tsup.config.ts"), `export default {${noExternal} };\n`);
  writeFileSync(join(pkgDir, "tsconfig.json"), "{}\n");
  writeFileSync(join(root, "tsconfig.base.json"), "{}\n");
  writeFileSync(join(root, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
  // What a finished build leaves behind.
  const build = () => {
    mkdirSync(join(pkgDir, "dist"), { recursive: true });
    writeFileSync(join(pkgDir, "dist/index.js"), "export const a = 1;\n");
  };
  return {
    root,
    pkgDir,
    build,
    canonical: join(pkgDir, BUILD_INFO_FILE),
    pending: join(pkgDir, PENDING_FILE),
    done: () => rmSync(root, { recursive: true, force: true }),
  };
}

test("a finished build leaves the record, and no pending file", () => {
  const f = fixture();
  recordPending(f.root, f.pkgDir);
  f.build();
  assert.equal(verifyAndStamp(f.root, f.pkgDir), null);
  assert.equal(existsSync(f.pending), false);
  assert.equal(
    JSON.parse(readFileSync(f.canonical, "utf8")).sourceHash,
    hashPackageSources(f.root, "packages/thing"),
  );
  f.done();
});

// The bundlers this repository uses clean their own output but leave
// dotfiles alone, so the record has to be dropped by the build itself.
test("the next build drops the record before it starts", () => {
  const f = fixture();
  recordPending(f.root, f.pkgDir);
  f.build();
  verifyAndStamp(f.root, f.pkgDir);
  assert.equal(existsSync(f.canonical), true);

  recordPending(f.root, f.pkgDir);
  assert.equal(existsSync(f.canonical), false, "a record from the last build survived");
  assert.equal(existsSync(f.pending), true);
  f.done();
});

test("a build that fails partway stamps nothing", () => {
  const f = fixture();
  recordPending(f.root, f.pkgDir);
  f.build();
  verifyAndStamp(f.root, f.pkgDir);

  // The build starts again, clears what it is about to replace, and dies.
  recordPending(f.root, f.pkgDir);
  rmSync(join(f.pkgDir, "dist/index.js"));
  assert.equal(existsSync(f.canonical), false);
  assert.match(verifyAndStamp(f.root, f.pkgDir), /wrote no/);
  assert.equal(existsSync(f.canonical), false);
  f.done();
});

test("--verify alone cannot stamp a dist the build never wrote", () => {
  const f = fixture();
  recordPending(f.root, f.pkgDir);
  assert.match(verifyAndStamp(f.root, f.pkgDir), /run the whole build/);
  assert.equal(existsSync(f.canonical), false);
  f.done();
});

test("a source edited while the build ran is refused", () => {
  const f = fixture();
  recordPending(f.root, f.pkgDir);
  f.build();
  writeFileSync(join(f.pkgDir, "src/index.ts"), "export const a = 2;\n");
  assert.match(verifyAndStamp(f.root, f.pkgDir), /sources changed/);
  assert.equal(existsSync(f.canonical), false);
  f.done();
});

// A package that copies a workspace dependency into its own dist holds a
// copy, so the dependency's record is one of its inputs.
test("a bundled workspace dependency counts as an input", () => {
  const f = fixture({ bundles: ["@design-system/core"] });
  mkdirSync(join(f.root, "core/dist"), { recursive: true });
  writeFileSync(join(f.root, "core/package.json"), JSON.stringify({ name: "@design-system/core" }));
  writeFileSync(join(f.root, "core/dist/.build-info.json"), '{ "sourceHash": "first" }');
  const before = hashPackageSources(f.root, "packages/thing");

  writeFileSync(join(f.root, "core/dist/.build-info.json"), '{ "sourceHash": "second" }');
  assert.notEqual(hashPackageSources(f.root, "packages/thing"), before);
  f.done();
});

test("a dependency it does not bundle is not an input", () => {
  const f = fixture();
  mkdirSync(join(f.root, "core/dist"), { recursive: true });
  writeFileSync(join(f.root, "core/package.json"), JSON.stringify({ name: "@design-system/core" }));
  writeFileSync(join(f.root, "core/dist/.build-info.json"), '{ "sourceHash": "first" }');
  const before = hashPackageSources(f.root, "packages/thing");

  writeFileSync(join(f.root, "core/dist/.build-info.json"), '{ "sourceHash": "second" }');
  assert.equal(hashPackageSources(f.root, "packages/thing"), before);
  f.done();
});

// The guard the adapters run is what a developer meets after a build dies.
test("the adapter guard refuses the dist a failed core build leaves", () => {
  const f = fixture({ pkgRel: "core", name: "@design-system/core" });
  mkdirSync(join(f.pkgDir, "scripts"), { recursive: true });
  writeFileSync(join(f.pkgDir, "scripts/clean-dist.mjs"), "");
  writeFileSync(join(f.pkgDir, "scripts/patch-esm-specifiers.mjs"), "");
  recordPending(f.root, f.pkgDir);
  f.build();
  assert.equal(verifyAndStamp(f.root, f.pkgDir), null);
  assert.equal(checkCoreDist(f.root), null);

  // The next build starts and dies: dist still holds the old files.
  recordPending(f.root, f.pkgDir);
  assert.match(checkCoreDist(f.root), /no build info/);
  f.done();
});
