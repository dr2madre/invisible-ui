// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The Vue adapter ships its own copy of the component stylesheets so it is
// self-contained when published. Those copies must never drift from the React
// adapter's (which in turn guards its tokens against the Svelte adapter's):
// the adapters render the same design system, and a silent divergence would
// show up as adapters that look subtly different.
//
// `index.css` is excluded: it names this package in its comment and in the
// import path it documents, so its text is package-specific even though it now
// pulls in the same six sheets.

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const SHEETS = [
  "tokens.css",
  "button.css",
  "checkbox.css",
  "switch.css",
  "combobox.css",
  "dialog.css",
  "select.css",
];

describe("stylesheet parity with the React adapter", () => {
  it.each(SHEETS)("%s matches byte for byte", (sheet) => {
    expect(read(`./${sheet}`)).toBe(read(`../../../react/src/styles/${sheet}`));
  });
});
