import { expect, test } from "@playwright/test";

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
});
