import { expect, test } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// WCAG 2.2 SC 2.5.8 (Target Size, Minimum): a pointer target is at least
// 24 by 24 CSS pixels. This walks every built component page and fails on a
// library control smaller than that, so a shrunken control cannot ship again.
//
// Out of scope by the success criterion itself: targets inside a sentence
// (the inline exception) and the documentation theme's own chrome.

const PAGES_ROOT = "packages/docs/dist/components";

const componentPages = (): string[] => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? walk(path) : entry === "index.html" ? [path] : [];
    });
  return walk(PAGES_ROOT).map((path) => relative(PAGES_ROOT, path).replace(/index\.html$/, ""));
};

test("every library pointer target is at least 24 by 24 CSS pixels", async ({ page }) => {
  const undersized: string[] = [];

  for (const url of componentPages()) {
    await page.goto(`components/${url}`);
    // The demos hydrate on visibility; give the islands a beat to settle.
    await page.waitForLoadState("domcontentloaded");
    const found = await page.evaluate(() => {
      const out: string[] = [];
      const selector = [
        "button",
        "[role=option]",
        "[role=menuitem]",
        "[role=menuitemcheckbox]",
        "[role=menuitemradio]",
        "[role=tab]",
        "[role=radio]",
        "[role=checkbox]",
        "[role=switch]",
        "[role=spinbutton]",
      ].join(", ");
      for (const element of document.querySelectorAll(selector)) {
        const className = (element.className || "").toString();
        // The docs theme is not the library under test.
        if (/\bsl-|pagefind|astro/.test(className)) continue;
        let rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        // A visually hidden native input is not what the pointer hits: the
        // label that wraps the styled control is. Measure that instead.
        if (rect.width <= 2 && rect.height <= 2) {
          const label = element.closest("label");
          if (!label) continue;
          rect = label.getBoundingClientRect();
        }
        if (rect.width < 24 || rect.height < 24) {
          const name = element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "";
          out.push(
            `${Math.round(rect.width)}x${Math.round(rect.height)} ` +
              `${element.tagName.toLowerCase()}.${className.split(" ")[0] || "(none)"} ` +
              `"${name.slice(0, 24)}"`,
          );
        }
      }
      return [...new Set(out)];
    });
    for (const entry of found) undersized.push(`${url} :: ${entry}`);
  }

  expect(undersized).toEqual([]);
});
