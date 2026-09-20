import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRegister, countTests, citedPaths, citedCounts } from "./check-evidence-register.mjs";

// A miniature repository: a register and the files it cites.
function fixture(register, files = {}) {
  const root = mkdtempSync(join(tmpdir(), "register-"));
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs/evidence-register.md"), register);
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

const suite = (n) => Array.from({ length: n }, (_, i) => `  it("${i}", () => {});`).join("\n");

test("a register whose citations all hold passes", () => {
  const f = fixture("| unit: 3 tests in `scripts/a.test.mjs` | held |", {
    "scripts/a.test.mjs": suite(3),
  });
  assert.deepEqual(checkRegister(f.root), []);
  f.done();
});

test("a cited file that does not exist is refused", () => {
  const f = fixture("| unit: `scripts/gone.test.mjs` | held |");
  assert.match(checkRegister(f.root)[0], /cites scripts\/gone\.test\.mjs, which does not exist/);
  f.done();
});

test("a count that no longer matches is refused, with both numbers", () => {
  const f = fixture("| unit: 12 tests in `scripts/a.test.mjs` | held |", {
    "scripts/a.test.mjs": suite(5),
  });
  assert.match(checkRegister(f.root)[0], /says 12 tests in scripts\/a\.test\.mjs; it declares 5/);
  f.done();
});

test("a row waiting on a pull request must say the claim is not made yet", () => {
  const withoutCaveat = fixture("| gate: something | held once #42 lands |");
  assert.match(checkRegister(withoutCaveat.root)[0], /without saying the claim is not made/);
  withoutCaveat.done();

  const withCaveat = fixture("| gate: something | held once #42 lands; not claimed before then |");
  assert.deepEqual(checkRegister(withCaveat.root), []);
  withCaveat.done();
});

test("a missing register is refused rather than passing quietly", () => {
  const root = mkdtempSync(join(tmpdir(), "register-"));
  assert.match(checkRegister(root)[0], /is missing/);
  rmSync(root, { recursive: true, force: true });
});

test("the counter follows vitest and node:test spellings", () => {
  assert.equal(countTests('it("a", () => {});\ntest("b", () => {});'), 2);
  assert.equal(countTests('it.each([1])("a", () => {});\nit.skip("b", () => {});'), 2);
  // A description that mentions a test is not a test.
  assert.equal(countTests('// it( is written about here\nconst s = "test(";'), 0);
});

test("the readers take paths and counts out of real register prose", () => {
  const register =
    "| `docs/contract.md` | unit: 9 tests in `core/src/a.test.ts`, plus `e2e/b.spec.ts` on Chromium |";
  assert.deepEqual(citedPaths(register), [
    "core/src/a.test.ts",
    "docs/contract.md",
    "e2e/b.spec.ts",
  ]);
  assert.deepEqual(citedCounts(register), [{ path: "core/src/a.test.ts", claimed: 9 }]);
});

test("the repository's own register is accurate", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  assert.deepEqual(checkRegister(root), []);
});
