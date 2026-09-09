// The specifier reader's rules, on fixture strings. Each case here is a shape
// the packaging checks read wrongly before: an import that shares its line
// with a script tag, one that is commented out, one written for types only.
//
//   node --test scripts/

import { test } from "node:test";
import assert from "node:assert/strict";

import { specifiersOf, withoutComments, withoutQuery } from "./specifiers.mjs";

const found = (text) => specifiersOf(text).specifiers;

test("an import sharing its line with a script tag is read", () => {
  assert.deepEqual(found('<script lang="ts">import { chunk } from "lodash-es";</script>'), [
    "lodash-es",
  ]);
});

test("a commented-out import is not an import", () => {
  assert.deepEqual(found('// import { x } from "nope";\nimport { y } from "yes";'), ["yes"]);
  assert.deepEqual(found('/* import a from "nope" */\nimport b from "yes";'), ["yes"]);
  assert.deepEqual(found('<!-- import a from "nope" -->\nimport b from "yes";'), ["yes"]);
});

test("a url inside a string is not a comment", () => {
  assert.deepEqual(found('const u = "https://example.com";\nimport a from "kept";'), ["kept"]);
});

test("an import of types only is not something to resolve", () => {
  assert.deepEqual(found('import type { A } from "svelte/action";\nimport { b } from "real";'), [
    "real",
  ]);
  assert.deepEqual(found('import { type A, b } from "mixed";'), ["mixed"]);
});

test("every other form is read: side effect, star, dynamic, require, css", () => {
  assert.deepEqual(found('import "./register.js";'), ["./register.js"]);
  assert.deepEqual(found('export * from "lodash-es";'), ["lodash-es"]);
  assert.deepEqual(found('const m = await import(\n  "lazy"\n);'), ["lazy"]);
  assert.deepEqual(found('const x = require("cjs");'), ["cjs"]);
  assert.deepEqual(found('@import "@design-system/svelte/tokens.css";'), [
    "@design-system/svelte/tokens.css",
  ]);
  assert.deepEqual(found("@import url('./a.css');"), ["./a.css"]);
});

test("a dynamic import nobody can name is counted, not guessed at", () => {
  assert.equal(specifiersOf("const m = await import(name);").computed, 1);
  assert.equal(specifiersOf("const m = await import(`./${name}.js`);").computed, 1);
  assert.equal(specifiersOf('const m = await import("./a.js");').computed, 0);
});

test("a build tool's query suffix names the same file", () => {
  assert.equal(
    withoutQuery("@design-system/svelte/tokens.css?raw"),
    "@design-system/svelte/tokens.css",
  );
  assert.equal(withoutQuery("./a.svg?url&inline"), "./a.svg");
  assert.equal(withoutQuery("./a.js"), "./a.js");
});

test("stripping comments leaves the code that surrounded them", () => {
  assert.equal(withoutComments("a /* b */ c"), "a  c");
  assert.equal(withoutComments("a // b\nc"), "a \nc");
});
