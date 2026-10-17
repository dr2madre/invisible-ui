// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// A coarse pointer gets the touch target from the token,
// density.touch.min-target-size as --ds-min-target-size-touch, never a
// literal: visual density never reduces it. The Vue and Elements copies are
// byte-identical to these sheets (styles-parity tests).

const dir = fileURLToPath(new URL(".", import.meta.url));
const sheets = readdirSync(dir).filter((file) => file.endsWith(".css"));
const read = (file: string) => readFileSync(`${dir}/${file}`, "utf8");

/** The body of every `@media (pointer: coarse)` block in a sheet. */
const coarseBlocks = (css: string) => {
  const out: string[] = [];
  for (const match of css.matchAll(/@media \(pointer: coarse\)\s*\{/g)) {
    let depth = 1;
    let i = match.index + match[0].length;
    const from = i;
    for (; depth > 0 && i < css.length; i++) {
      if (css[i] === "{") depth++;
      if (css[i] === "}") depth--;
    }
    out.push(css.slice(from, i - 1));
  }
  return out;
};

const TOKEN = "var(--ds-min-target-size-touch, 44px)";

describe("touch target under a coarse pointer", () => {
  it("is set by the menus, the navigation bar and the tabs actions", () => {
    const withRules = sheets.filter((file) => coarseBlocks(read(file)).length > 0).sort();
    expect(withRules).toEqual([
      "context-menu.css",
      "dropdown-menu.css",
      "menubar.css",
      "navigation-bar.css",
      "tabs.css",
    ]);
  });

  it.each(sheets)("%s reads the token, 44 by 44, never a literal", (file) => {
    for (const block of coarseBlocks(read(file))) {
      expect(block).not.toMatch(/:\s*44px/);
      for (const property of ["min-block-size", "min-inline-size"]) {
        expect(block, `${file} ${property}`).toContain(`${property}: ${TOKEN};`);
      }
    }
  });
});
