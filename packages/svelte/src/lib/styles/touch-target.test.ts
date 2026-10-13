// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// A coarse pointer gets the touch target from the token,
// density.touch.min-target-size as --ds-min-target-size-touch: 44 by 44 for
// every menu item and menubar trigger, as in the other adapters' sheets.

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const TOKEN = "var(--ds-min-target-size-touch, 44px)";

describe("touch target under a coarse pointer", () => {
  it.each([
    ["../dropdown-menu/DropdownMenu.svelte", [".menu__item"]],
    ["../context-menu/ContextMenu.svelte", [".context-menu__item"]],
    ["../menubar/Menubar.svelte", [".menubar__item", ".menubar__trigger"]],
  ])("%s gives its items 44 by 44 from the token", (file, selectors) => {
    const block = /@media \(pointer: coarse\) \{([\s\S]*?)\n {2}\}/.exec(read(file))?.[1];
    expect(block, file).toBeDefined();
    for (const selector of selectors) expect(block).toContain(selector);
    expect(block).toContain(`min-block-size: ${TOKEN};`);
    expect(block).toContain(`min-inline-size: ${TOKEN};`);
  });
});
