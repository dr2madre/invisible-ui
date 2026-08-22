import { expect, test } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// WCAG 1.4.10 (Reflow): at 320 CSS pixels the page presents without
// horizontal scrolling. This walks every built component page at that width
// and fails on any page-level overflow, so one wide demo or one unbounded
// component cannot push the whole page sideways again. Wide content may
// still scroll inside its own container; only the page itself is held flat.

const PAGES_ROOT = "packages/docs/dist/components";

const componentPages = (): string[] => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? walk(path) : entry === "index.html" ? [path] : [];
    });
  return walk(PAGES_ROOT).map((path) => relative(PAGES_ROOT, path).replace(/index\.html$/, ""));
};

test("every component page reflows at 320 CSS pixels without page scroll", async ({ page }) => {
  // Walking every page with a hydration pause outgrows the default budget,
  // most of all on the slower engines.
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 320, height: 900 });
  const overflowing: string[] = [];

  for (const url of componentPages()) {
    await page.goto(`components/${url}`);
    // The demos hydrate on visibility; give the islands a beat to settle.
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) overflowing.push(`${url} :: ${overflow}px`);
  }

  expect(overflowing, overflowing.join("\n")).toEqual([]);
});
