import { expect, test } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Windows High Contrast (forced colors) replaces the author's colours with the
// user's palette and drops most backgrounds. A control whose only boundary is
// a background colour therefore disappears. This checks that every control on
// the risk-tier pages keeps a boundary the user can see, and that state stays
// distinguishable by something other than colour.
//
// Emulation is Chromium-only, so this supports (never replaces) the manual
// Windows pass.

const PAGES = [
  "components/forms/combobox/",
  "components/forms/number-field/",
  "components/forms/select/",
  "components/patterns/table-set/",
  "components/feedback/dialog/",
  "components/data-layout/tabs/",
];

test.describe("forced colors", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "emulation is Chromium-only");

  test("every control keeps a visible boundary", async ({ browser }) => {
    const context = await browser.newContext({ forcedColors: "active" });
    const page = await context.newPage();
    const invisible: string[] = [];

    for (const url of PAGES) {
      await page.goto(url);
      await page.waitForLoadState("domcontentloaded");
      const found = await page.evaluate(() => {
        const out: string[] = [];
        const selector = "button, input, select, textarea, [role=option], [role=tab]";
        for (const element of document.querySelectorAll(selector)) {
          const className = (element.className || "").toString();
          if (/\bsl-|pagefind|astro/.test(className)) continue;
          // The documentation theme's own chrome (code-block copy buttons)
          // is not the library under test.
          if (element.closest(".copy, .expressive-code, header, nav")) continue;
          const rect = element.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) continue;
          const style = getComputedStyle(element);
          const hasBorder =
            parseFloat(style.borderTopWidth) > 0 ||
            parseFloat(style.borderBottomWidth) > 0 ||
            parseFloat(style.borderLeftWidth) > 0 ||
            parseFloat(style.borderRightWidth) > 0;
          const hasOutline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
          // Text carries its own shape, so a bare text button still reads.
          const hasText = (element.textContent ?? "").trim().length > 0;
          if (!hasBorder && !hasOutline && !hasText) {
            out.push(`${element.tagName.toLowerCase()}.${className.split(" ")[0] || "(none)"}`);
          }
        }
        return [...new Set(out)];
      });
      for (const entry of found) invisible.push(`${url} :: ${entry}`);
    }

    await context.close();
    expect(invisible).toEqual([]);
  });

  // Every focusable control on every built component page must show a focus
  // indicator the platform preserves. A box-shadow does not survive forced
  // colors, so a control whose ring is only a shadow fails here.
  test("every reachable control shows a focus indicator", async ({ browser }) => {
    test.setTimeout(600_000);
    const context = await browser.newContext({ forcedColors: "active" });
    const page = await context.newPage();
    const unfocusable: string[] = [];

    for (const url of componentPages()) {
      await page.goto(`components/${url}`);
      await page.waitForLoadState("load");
      const found = await page.evaluate(() => {
        const out: string[] = [];
        const selector =
          "button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])";
        for (const element of document.querySelectorAll<HTMLElement>(selector)) {
          const className = (element.className || "").toString();
          // The documentation theme's own chrome is not the library under test.
          if (/\bsl-|pagefind|astro-/.test(className)) continue;
          if (element.closest("header, nav.sidebar, .right-sidebar, .copy, .expressive-code"))
            continue;
          if ((element as HTMLInputElement).disabled) continue;
          const box = element.getBoundingClientRect();
          const hidden = box.width < 2 || box.height < 2;
          element.focus();
          if (!element.matches(":focus-visible")) continue;
          // A hidden input paints nothing itself: its ring belongs to the
          // visible partner beside it or around it.
          const ringOn = (node: Element | null | undefined) => {
            if (!node) return false;
            const style = getComputedStyle(node);
            return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
          };
          // A hidden input's own outline paints nothing: only a partner counts.
          const candidates: (Element | null)[] = hidden ? [] : [element];
          if (hidden) {
            candidates.push(element.nextElementSibling);
            let ancestor: Element | null = element.parentElement;
            for (let up = 0; up < 3 && ancestor; up += 1) {
              candidates.push(ancestor);
              ancestor = ancestor.parentElement;
            }
          }
          const ringed = candidates.some(ringOn);
          if (!ringed) {
            out.push(`${element.tagName.toLowerCase()}.${className.split(" ")[0] || "(none)"}`);
          }
        }
        return [...new Set(out)];
      });
      for (const entry of found) unfocusable.push(`${url} :: ${entry}`);
    }

    await context.close();
    expect(unfocusable, unfocusable.join("\n")).toEqual([]);
  });
});

const PAGES_ROOT = "packages/docs/dist/components";

const componentPages = (): string[] => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? walk(path) : entry === "index.html" ? [path] : [];
    });
  return walk(PAGES_ROOT).map((path) => relative(PAGES_ROOT, path).replace(/index\.html$/, ""));
};
