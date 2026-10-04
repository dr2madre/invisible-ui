// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The Vue adapter ships its own copy of the component stylesheets so it is
// self-contained when published.
//
// SHARED_SHEETS exist in both the React and the Vue adapter and must never
// drift from the React copies (which in turn guard their tokens against the
// Svelte adapter's): the adapters render the same design system, and a silent
// divergence would show up as adapters that look subtly different.
//
// VUE_SOURCE_SHEETS are the sheets only this adapter ships: the hover card,
// which sits outside the catalog. Each is checked to be present here and
// absent from the React adapter: the day React gains one, this test fails and
// the sheet moves to SHARED_SHEETS.
//
// `index.css` is excluded: it names this package in its comment and in the
// import path it documents, so its text is package-specific even though it
// only pulls the sheets together.

const path = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const read = (rel: string) => readFileSync(path(rel), "utf8");

const SHARED_SHEETS = [
  "tokens.css",
  "tag.css",
  "multi-select.css",
  "button.css",
  "checkbox.css",
  "switch.css",
  "combobox.css",
  "dialog.css",
  "dialog-header.css",
  "feedback-icon.css",
  "inline-notification.css",
  "select.css",
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
  "calendar.css",
  "date-picker.css",
  "date-range-picker.css",
  "time-field.css",
  "separator.css",
  "button-group.css",
  "breadcrumb.css",
  "collapsible.css",
  "accordion.css",
  "tabs.css",
  "pagination.css",
  "stepper.css",
  "tree-view.css",
  "sidebar.css",
  "field.css",
  "label.css",
  "progress.css",
  "skeleton.css",
  "count.css",
  "card.css",
  "avatar.css",
  "avatar-group.css",
  "meter.css",
  "link.css",
  "blockquote.css",
  "aspect-ratio.css",
  "code.css",
  "code-block.css",
  "scroll-area.css",
  "notification-region.css",
  "empty-state.css",
  "error-state.css",
  "loading-generation-area.css",
  "textarea.css",
  "table.css",
  "table-set.css",
  "toolbar.css",
  "carousel.css",
  "login-form.css",
  "upload-drop-area.css",
];

const VUE_SOURCE_SHEETS = ["hover-card.css"];

describe("stylesheet parity with the React adapter", () => {
  it.each(SHARED_SHEETS)("%s matches byte for byte", (sheet) => {
    expect(read(`./${sheet}`)).toBe(read(`../../../react/src/styles/${sheet}`));
  });
});

describe("Vue-only stylesheets", () => {
  it.each(VUE_SOURCE_SHEETS)("%s is present here and not in React", (sheet) => {
    expect(read(`./${sheet}`).length).toBeGreaterThan(0);
    expect(existsSync(path(`../../../react/src/styles/${sheet}`))).toBe(false);
  });
});
