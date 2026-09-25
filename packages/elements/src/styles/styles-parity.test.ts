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
  "tag.css",
  "multi-select.css",
  "button.css",
  "checkbox.css",
  "switch.css",
  "select.css",
  "combobox.css",
  "dialog.css",
  "dialog-header.css",
  "text-field.css",
  "search-field.css",
];

const VUE_SHEETS = [
  "field.css",
  "label.css",
  "textarea.css",
  "radio-group.css",
  "checkbox-group.css",
  "table.css",
  "count.css",
  "tabs.css",
  "pagination.css",
  "card.css",
  "separator.css",
  "feedback-icon.css",
  "empty-state.css",
  "error-state.css",
  "inline-notification.css",
  "loading.css",
  "loading-generation-area.css",
  "sheet-dialog.css",
  "tree-view.css",
  "avatar.css",
  "sidebar.css",
  "tooltip.css",
  "navigation-menu.css",
  "dropdown-menu.css",
  "context-menu.css",
  "menubar.css",
  "breadcrumb.css",
  "progress.css",
  "scroll-area.css",
  "avatar-group.css",
  "kbd.css",
  "link.css",
  "button-group.css",
  "toolbar.css",
  "upload-drop-area.css",
  "login-form.css",
  "radio.css",
  "segmented-control.css",
  "popover.css",
  "table-set.css",
  "alert-dialog.css",
  "confirm-dialog.css",
  "prompt-dialog.css",
  "search-dialog.css",
  "toggle-button.css",
  "toggle-group.css",
  "accordion.css",
  "collapsible.css",
  "aspect-ratio.css",
  "blockquote.css",
  "skeleton.css",
  "meter.css",
  "number-field.css",
  "pin-input.css",
  "notification-region.css",
  "stepper.css",
  "slider.css",
  "range-slider.css",
  "rating-group.css",
  "code.css",
  "code-block.css",
  "carousel.css",
];

describe("stylesheet parity with the React adapter", () => {
  it.each(REACT_SHEETS)("%s matches byte for byte", (sheet) => {
    expect(read(`./${sheet}`)).toBe(read(`../../../react/src/styles/${sheet}`));
  });
});

describe("native dialog visibility", () => {
  it("applies the grid layout only after the dialog is open", () => {
    const dialog = read("./dialog.css");
    expect(dialog).toMatch(/\.dialog__panel\[open\]\s*\{[^}]*display:\s*grid/s);
    expect(dialog).not.toMatch(/\.dialog__panel\s*\{[^}]*display:\s*grid/s);
  });

  it("applies the sheet layout only after the sheet dialog is open", () => {
    const sheet = read("./sheet-dialog.css");
    expect(sheet).toMatch(/\.sheet-dialog__panel\[open\]\s*\{[^}]*display:\s*flex/s);
    expect(sheet).not.toMatch(/\.sheet-dialog__panel\s*\{[^}]*display:\s*flex/s);
  });
});

describe("login form width", () => {
  // The card sizes its content box, so its padding and border must come out
  // of the available width or it overflows a 320px viewport.
  it("keeps the padding and the border inside the container", () => {
    const sheet = read("./login-form.css");
    expect(sheet).toMatch(
      /\.login\s*\{[^}]*inline-size:\s*min\(\s*100% - 2 \* var\(--ds-login-padding, 1\.75rem\) - 2px,/s,
    );
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
