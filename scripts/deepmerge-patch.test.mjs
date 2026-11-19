import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const styleDictionaryEntry = require.resolve("style-dictionary");
const bundledEntry = require.resolve("@bundled-es-modules/deepmerge", {
  paths: [dirname(styleDictionaryEntry)],
});
const deepmergeEntry = require.resolve("deepmerge", { paths: [dirname(bundledEntry)] });
const deepmerge = require(deepmergeEntry);

test("the deepmerge patch drops an own __proto__ key", () => {
  const source = JSON.parse('{"safe":true,"__proto__":{"polluted":true}}');
  const result = deepmerge({}, source);

  assert.equal(result.safe, true);
  assert.equal(result.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
});
