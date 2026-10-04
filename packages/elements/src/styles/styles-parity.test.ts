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
  "dialog-status.css",
  "feedback-icon.css",
  "inline-notification.css",
  "text-field.css",
  "search-field.css",
  "alert-dialog.css",
  "confirm-dialog.css",
  "prompt-dialog.css",
  "search-dialog.css",
  "sheet-dialog.css",
  "kbd.css",
  "loading.css",
  "popover.css",
  "tooltip.css",
  "dropdown-menu.css",
  "context-menu.css",
  "menubar.css",
  "navigation-menu.css",
  "radio.css",
  "radio-group.css",
  "checkbox-group.css",
  "segmented-control.css",
  "toggle-button.css",
  "toggle-group.css",
  "slider.css",
  "range-slider.css",
  "number-field.css",
  "pin-input.css",
  "rating-group.css",
];

const VUE_SHEETS = [
  "field.css",
  "label.css",
  "textarea.css",
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
  "loading-generation-area.css",
  "tree-view.css",
  "avatar.css",
  "sidebar.css",
  "breadcrumb.css",
  "progress.css",
  "scroll-area.css",
  "avatar-group.css",
  "link.css",
  "button-group.css",
  "toolbar.css",
  "upload-drop-area.css",
  "login-form.css",
  "table-set.css",
  "dialog-status.css",
  "accordion.css",
  "collapsible.css",
  "aspect-ratio.css",
  "blockquote.css",
  "skeleton.css",
  "meter.css",
  "notification-region.css",
  "stepper.css",
  "code.css",
  "code-block.css",
  "carousel.css",
  "calendar.css",
  "date-picker.css",
  "date-range-picker.css",
  "time-field.css",
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

// The copies above are held byte for byte to these, so checking this
// package's sheet covers every adapter that shares it.
const block = (sheet: string, at: string) => {
  const css = read(`./${sheet}`);
  const start = css.indexOf(at);
  return start === -1 ? "" : css.slice(start);
};
const rule = (sheet: string, selector: string) => {
  const css = read(`./${sheet}`);
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`(?:^|\\n|,\\s*)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
};
const RING =
  /box-shadow:\s*inset 0 0 0 var\(--ds-focus-ring-width, 2px\) var\(--ds-color-focus-ring/;

describe("selection in forced colors", () => {
  it("marks the calendar's selected days and range with system colours", () => {
    const forced = block("calendar.css", "@media (forced-colors: active)");
    for (const selector of [
      ".calendar__day[data-selected]",
      ".calendar__day[data-range-start]",
      ".calendar__day[data-range-end]",
      ".calendar__mini-day[data-selected]",
      ".calendar__agenda-head[data-selected]",
    ]) {
      expect(forced).toContain(selector);
    }
    expect(forced).toMatch(/background:\s*Highlight/);
    expect(forced).toMatch(/\.calendar__day\[data-in-range\]\s*\{[^}]*Highlight/);
  });

  it("marks the current page with system colours", () => {
    const forced = block("pagination.css", "@media (forced-colors: active)");
    expect(forced).toMatch(/\.pagination__page\[data-selected\]\s*\{[^}]*background:\s*Highlight/);
  });
});

describe("the calendar range and year view", () => {
  it("closes the in-range band with lines in the selection colour", () => {
    expect(rule("calendar.css", ".calendar__day[data-in-range]")).toMatch(
      /border-block-color:\s*var\(--ds-color-selected/,
    );
  });

  it("keeps each mini day at least 24px", () => {
    expect(rule("calendar.css", ".calendar__mini-day")).toMatch(/min-block-size:\s*1\.5rem/);
    expect(rule("calendar.css", ".calendar__mini-weekdays")).toMatch(
      /grid-template-columns:\s*repeat\(7, minmax\(1\.5rem, 1fr\)\)/,
    );
  });
});

describe("the messages a control renders for itself", () => {
  it("styles the error like the text field's, glyph included", () => {
    expect(rule("field.css", ".field__message.field__error")).toMatch(
      /color:\s*var\(--ds-field-error-color, var\(--ds-color-danger-body-text/,
    );
    expect(rule("field.css", ".field__message .field__msg-icon")).toMatch(/flex:\s*none/);
  });
});

describe("a table row that takes focus", () => {
  it("shows a focus ring inside the row", () => {
    expect(read("./table-set.css")).toMatch(
      /\.table-view tbody tr\[tabindex="-1"\]:focus-visible,[^{]*\{[^}]*outline:\s*var\(--ds-focus-ring-width/,
    );
  });
});

describe("the focused or active item in menus and lists", () => {
  it.each([
    ["dropdown-menu.css", ".menu__item:focus-visible"],
    ["context-menu.css", ".context-menu__item:focus-visible"],
    ["menubar.css", ".menubar__item:focus-visible"],
    ["combobox.css", ".combobox__option[data-active]"],
    ["multi-select.css", ".multi-select__option[data-active]"],
    ["search-dialog.css", ".search-dialog__item[data-active]"],
    ["search-dialog.css", ".search-dialog__search:focus-within"],
  ])("%s draws a focus ring on %s", (sheet, selector) => {
    expect(rule(sheet, selector)).toMatch(RING);
  });

  it("keeps the combobox ring on the selected option", () => {
    // The ring rule must not exclude the selected state.
    expect(read("./combobox.css")).toMatch(
      /\n\.combobox__option\[data-active\]\s*\{[^}]*box-shadow/,
    );
  });
});

describe("reduced motion", () => {
  it.each([
    ["switch.css", ".switch::after"],
    ["accordion.css", ".accordion__icon"],
    ["collapsible.css", ".collapsible__icon"],
    ["dropdown-menu.css", ".menu__chevron"],
    ["tabs.css", ".tabs__tab"],
    ["segmented-control.css", ".segment"],
    ["combobox.css", ".combobox__control"],
    ["combobox.css", ".combobox__chevron"],
  ])("%s turns off the transition on %s", (sheet, selector) => {
    const reduced = block(sheet, "@media (prefers-reduced-motion: reduce)");
    expect(reduced).toContain(selector);
    expect(reduced).toMatch(/transition:\s*none/);
  });
});
