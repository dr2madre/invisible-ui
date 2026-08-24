// The registry's reading and comparing rules, on fixture strings rather than
// on the repository: a bug that is a no-op today would otherwise be invisible
// until the day someone writes the shape that triggers it.
//
//   node --test scripts/

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSheet, parseUsages, shapeOfValue, placeOf } from "./generate-token-registry.mjs";

test("a declaration that ends at its closing brace is read", () => {
  assert.equal(parseUsages(".a { color: var(--ds-probe, #fff) }", "f.css").length, 1);
  assert.equal(parseSheet(":root { --ds-probe: #fff }")[0]?.name, "--ds-probe");
});

test("a trailing declaration keeps its own comment out of the next run", () => {
  const found = parseSheet(`:root {
  /* Type scale */
  --ds-size-a: 1rem;
  --ds-size-b: 2rem /* 32px */
}`);
  assert.deepEqual(
    found.map((entry) => [entry.name, entry.group]),
    [
      ["--ds-size-a", "Type scale"],
      ["--ds-size-b", "Type scale"],
    ],
  );
});

test("a declaration is attributed to the block it sits in, not the one after it", () => {
  const found = parseSheet(`@media (prefers-color-scheme: dark) {
  :root { --ds-a: #000 }
}
:root { --ds-b: #fff }`);
  assert.deepEqual(
    found.map((entry) => [entry.name, entry.layer]),
    [
      ["--ds-a", "darkMedia"],
      ["--ds-b", "light"],
    ],
  );
});

test("a fallback's family is read through one alias hop", () => {
  assert.equal(shapeOfValue("0.75rem"), "size");
  assert.equal(shapeOfValue("var(--ds-color-primary, #7a52cc)"), "color");
  assert.equal(
    shapeOfValue("var(--ds-control-padding-x, 0.75rem)", () => "0.75rem"),
    "size",
  );
  // Nothing to read: neither a family nor a wrong guess.
  assert.equal(shapeOfValue("inherit"), "other");
  assert.equal(shapeOfValue("none"), "other");
});

test("a place is the states in a selector, not its spelling", () => {
  assert.equal(placeOf("nav.menu .submenu:hover"), placeOf(".menu .submenu:hover"));
  assert.equal(placeOf(".segment:global([data-size='lg'])"), placeOf(".segment[data-size='lg']"));
  assert.notEqual(placeOf('.x[data-size="sm"]'), placeOf('.x[data-size="lg"]'));
  assert.equal(placeOf(".root"), "");
});
