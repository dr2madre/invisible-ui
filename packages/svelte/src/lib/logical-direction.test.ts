// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// What a real browser shows in right-to-left text is checked in
// e2e/rtl-direction.spec.ts. This guards the style rules those results come
// from, so a physical movement or a missing mirror fails before a browser does.

const source = (path: string) =>
  readFileSync(fileURLToPath(new URL(`./${path}`, import.meta.url)), "utf8");

/** The declarations of the first rule whose selector is `selector`. */
const rule = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start));
};

describe("switch", () => {
  const css = source("switch/Switch.svelte");

  it("moves the thumb along the inline axis, never by a physical translate", () => {
    expect(css).not.toMatch(/translate:/);
    expect(rule(css, ".switch__input:checked + .switch::after")).toContain("inset-inline-start:");
    expect(rule(css, ".switch__input:checked + .switch--onoff.switch::after")).toContain(
      "inset-inline-start:",
    );
    expect(rule(css, ".switch::after")).toContain("transition: inset-inline-start");
  });
});

describe("directional glyphs", () => {
  const mirrored: Array<[string, string]> = [
    ["tree-view/TreeView.svelte", ".tree__twistie:dir(rtl)"],
    ["accordion/Accordion.svelte", ".accordion__icon:dir(rtl)"],
    ["carousel/Carousel.svelte", ".carousel__arrow:dir(rtl)"],
    ["calendar/Calendar.svelte", ".calendar__arrow:dir(rtl)"],
    ["sidebar/SidebarGroup.svelte", ".sidebar__chevron:dir(rtl)"],
    ["sidebar/SidebarNav.svelte", ".sidebar__rail-toggle .sidebar__icon:dir(rtl)"],
  ];
  it.each(mirrored)("%s mirrors in right-to-left text", (path, selector) => {
    expect(rule(source(path), selector)).toContain("scale: -1 1");
  });

  it("turns the open accordion the other way, so it still points down", () => {
    expect(
      rule(
        source("accordion/Accordion.svelte"),
        '.accordion__trigger:global([data-state="open"]) .accordion__icon:dir(rtl)',
      ),
    ).toContain("rotate: -90deg");
  });
});

describe("sheet dialog", () => {
  const css = source("sheet-dialog/SheetDialog.svelte");

  it("names its edges start and end, with left and right as aliases", () => {
    for (const side of ["start", "end", "left", "right"]) {
      expect(css).toContain(`[data-side="${side}"]`);
    }
  });

  it("moves, drags and slides along the inline axis", () => {
    expect(css).not.toMatch(/transform: translateX\((?!-?100%)/);
    expect(css).toMatch(/sheet-dialog-in-end/);
    expect(css).toMatch(/\[data-side="end"\]:dir\(rtl\)/);
    expect(css).toMatch(/animation-name: sheet-dialog-in-start/);
    expect(css).toMatch(/calc\(-1 \* var\(--_sheet-drag, 0px\)\)/);
  });

  it("does not animate the snap back under reduced motion", () => {
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toMatch(/transition: none/);
    expect(reduced).toMatch(/animation: none/);
  });
});
