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
// VUE_SOURCE_SHEETS are the batches the React adapter has not ported yet:
// forms, overlays & menus, feedback, data & nav, then controls & inputs. These
// Vue sheets are the source
// of truth for the adapters that follow (web components are next). Each is
// checked to be present here and still absent from the React adapter: the day
// React gains one, this test fails and the sheet moves to SHARED_SHEETS.
//
// `index.css` is excluded: it names this package in its comment and in the
// import path it documents, so its text is package-specific even though it
// only pulls the sheets together.

const path = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const read = (rel: string) => readFileSync(path(rel), "utf8");

const SHARED_SHEETS = [
  "tokens.css",
  "button.css",
  "checkbox.css",
  "switch.css",
  "combobox.css",
  "dialog.css",
  "select.css",
];

const VUE_SOURCE_SHEETS = [
  "text-field.css",
  "textarea.css",
  "radio-group.css",
  "checkbox-group.css",
  "field.css",
  "label.css",
  "popover.css",
  "tooltip.css",
  "dropdown-menu.css",
  "alert-dialog.css",
  "confirm-dialog.css",
  "prompt-dialog.css",
  "feedback-icon.css",
  "inline-notification.css",
  "notification-region.css",
  "progress.css",
  "loading.css",
  "skeleton.css",
  "tag.css",
  "count.css",
  "tabs.css",
  "accordion.css",
  "card.css",
  "table.css",
  "pagination.css",
  "breadcrumb.css",
  "avatar.css",
  "avatar-group.css",
  "slider.css",
  "rating-group.css",
  "segmented-control.css",
  "toggle-button.css",
  "toggle-group.css",
  "pin-input.css",
  "radio.css",
  "meter.css",
  "toolbar.css",
  "button-group.css",
  "link.css",
  "kbd.css",
  "separator.css",
  "calendar.css",
  "date-picker.css",
  "date-range-picker.css",
  "time-field.css",
  "collapsible.css",
  "hover-card.css",
  "context-menu.css",
  "menu.css",
  "menubar.css",
  "navigation-menu.css",
  "aspect-ratio.css",
  "blockquote.css",
  "code.css",
  "code-block.css",
  "empty-state.css",
  "error-state.css",
  "loading-generation-area.css",
  "login-form.css",
  "upload-drop-area.css",
  "scroll-area.css",
  "stepper.css",
  "tree-view.css",
  "carousel.css",
  "sheet-dialog.css",
  "search-dialog.css",
  "table-set.css",
  "multi-select.css",
];

describe("stylesheet parity with the React adapter", () => {
  it.each(SHARED_SHEETS)("%s matches byte for byte", (sheet) => {
    expect(read(`./${sheet}`)).toBe(read(`../../../react/src/styles/${sheet}`));
  });
});

describe("Vue-first batch stylesheets (Vue is the source of truth)", () => {
  it.each(VUE_SOURCE_SHEETS)("%s is present here and not yet in React", (sheet) => {
    expect(read(`./${sheet}`).length).toBeGreaterThan(0);
    expect(existsSync(path(`../../../react/src/styles/${sheet}`))).toBe(false);
  });
});
