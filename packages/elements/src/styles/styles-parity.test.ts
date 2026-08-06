// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The elements package ships its own copy of the component stylesheets so it
// is self-contained when published.
//
// REACT_SHEETS cover the components React also ships: those copies must never
// drift from the React adapter's (which in turn guards its tokens against the
// Svelte adapter's).
//
// VUE_SHEETS cover the components this adapter gained ahead of React. Vue holds
// the whole catalog, so its copies are the source: same guard, different
// origin. When React gains one of these, its sheet moves up to REACT_SHEETS.
//
// `index.css` is excluded from both: it names this package in the import path
// it documents, and it lists exactly the sheets this adapter ships, which is a
// different set from React's.

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const REACT_SHEETS = [
  "tokens.css",
  "button.css",
  "checkbox.css",
  "switch.css",
  "select.css",
  "combobox.css",
  "dialog.css",
];

const VUE_SHEETS = [
  "field.css",
  "label.css",
  "text-field.css",
  "textarea.css",
  "radio-group.css",
  "checkbox-group.css",
];

describe("stylesheet parity with the React adapter", () => {
  it.each(REACT_SHEETS)("%s matches byte for byte", (sheet) => {
    expect(read(`./${sheet}`)).toBe(read(`../../../react/src/styles/${sheet}`));
  });
});

describe("stylesheet parity with the Vue adapter", () => {
  it.each(VUE_SHEETS)("%s matches byte for byte", (sheet) => {
    expect(read(`./${sheet}`)).toBe(read(`../../../vue/src/styles/${sheet}`));
  });
});

describe("the index", () => {
  it("imports every sheet this package ships", () => {
    const index = read("./index.css");
    for (const sheet of [...REACT_SHEETS, ...VUE_SHEETS]) {
      expect(index, `missing @import for ${sheet}`).toContain(`@import "./${sheet}"`);
    }
  });
});
