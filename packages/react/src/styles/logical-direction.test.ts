// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// What a real browser shows in right-to-left text is checked in
// e2e/rtl-direction.spec.ts. This guards the sheet rules those results come
// from, so a physical movement or a missing mirror fails before a browser does.

const sheet = (name: string) =>
  readFileSync(fileURLToPath(new URL(`./${name}.css`, import.meta.url)), "utf8");

/** The declarations of the first rule whose selector is `selector`. */
const rule = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start));
};

describe("switch", () => {
  const css = sheet("switch");

  it("moves the thumb along the inline axis, never by a physical translate", () => {
    expect(css).not.toMatch(/translate:/);
    expect(rule(css, ".switch__input:checked + .switch::after")).toContain("inset-inline-start:");
    expect(rule(css, ".switch__input:checked + .switch--onoff.switch::after")).toContain(
      "inset-inline-start:",
    );
    expect(rule(css, ".switch::after")).toContain("transition: inset-inline-start");
  });

  it("borders the selected track and thumb with primary", () => {
    expect(rule(css, ".switch")).toContain("border: 0;");
    expect(rule(css, ".switch")).toContain("box-shadow: none;");
    const selectedTrack = rule(css, ".switch__input:checked + .switch");
    expect(selectedTrack).toContain("--ds-components-general-action-primary-background-default");
    expect(selectedTrack).toContain("box-shadow: inset 0 0 0 1px");
    expect(rule(css, ".switch__input:checked + .switch::after")).toContain(
      "--ds-components-general-action-primary-background-default",
    );
  });

  it("moves the ON and OFF labels closer to the thumb", () => {
    expect(css).toContain("inset-inline-start: 0.625rem;");
    expect(css).toContain("inset-inline-end: 0.625rem;");
  });
});

describe("directional glyphs", () => {
  const mirrored: Array<[string, string]> = [
    ["tree-view", ".tree__twistie:dir(rtl)"],
    ["accordion", ".accordion__icon:dir(rtl)"],
    ["carousel", ".carousel__arrow:dir(rtl)"],
    ["calendar", ".calendar__arrow:dir(rtl)"],
    ["context-menu", ".context-menu__submenu-chevron:dir(rtl)"],
    ["dropdown-menu", ".menu__submenu-chevron:dir(rtl)"],
    ["menubar", ".menubar__submenu-chevron:dir(rtl)"],
  ];
  it.each(mirrored)("%s mirrors in right-to-left text", (name, selector) => {
    expect(rule(sheet(name), selector)).toContain("scale: -1 1");
  });

  it("turns the open accordion the other way, so it still points down", () => {
    expect(
      rule(sheet("accordion"), '.accordion__trigger[data-state="open"] .accordion__icon:dir(rtl)'),
    ).toContain("rotate: -90deg");
  });
});

describe("sheet dialog", () => {
  const css = sheet("sheet-dialog");

  it("names its lateral edges start and end, and has no physical left or right", () => {
    for (const side of ["start", "end"]) expect(css).toContain(`[data-side="${side}"]`);
    for (const side of ["left", "right"]) expect(css).not.toContain(`[data-side="${side}"]`);
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
