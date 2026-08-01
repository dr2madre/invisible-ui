// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The elements package ships its own copy of the component stylesheets so it
// is self-contained when published. Those copies must never drift from the
// React adapter's (which in turn guards its tokens against the Svelte
// adapter's): all three adapters render the same design.

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const SHEETS = [
  "tokens.css",
  "button.css",
  "checkbox.css",
  "switch.css",
  "select.css",
  "combobox.css",
  "dialog.css",
  "index.css",
];

describe("stylesheet parity with the React adapter", () => {
  it.each(SHEETS)("%s matches byte for byte", (sheet) => {
    expect(read(`./${sheet}`)).toBe(read(`../../../react/src/styles/${sheet}`));
  });
});
