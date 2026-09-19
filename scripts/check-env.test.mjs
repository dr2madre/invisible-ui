import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkEnvironment } from "./check-env.mjs";

function root() {
  const dir = mkdtempSync(join(tmpdir(), "env-"));
  mkdirSync(join(dir, "node_modules/.bin"), { recursive: true });
  mkdirSync(join(dir, "packages/docs/.astro"), { recursive: true });
  return dir;
}

test("a clean checkout has no problems", () => {
  const dir = root();
  assert.deepEqual(checkEnvironment(dir), []);
  rmSync(dir, { recursive: true, force: true });
});

test("a pnpm shim in the root node_modules/.bin is refused with its remedy", () => {
  const dir = root();
  writeFileSync(join(dir, "node_modules/.bin/pnpm"), "#!/bin/sh\n");
  const problems = checkEnvironment(dir);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /node_modules\/\.bin\/pnpm exists\. Remove it/);
  rmSync(dir, { recursive: true, force: true });
});

test("a live background astro preview is reported, a dead one is not", () => {
  const dir = root();
  writeFileSync(join(dir, "packages/docs/.astro/preview.json"), JSON.stringify({ pid: 4242 }));
  assert.match(checkEnvironment(dir, { isAlive: () => true })[0], /pid 4242.*astro preview stop/);
  assert.deepEqual(checkEnvironment(dir, { isAlive: () => false }), []);
  rmSync(dir, { recursive: true, force: true });
});
