import { expect, test, type Locator, type Page } from "@playwright/test";

// A table wider than its Table Set card scrolls inside the card instead of
// being cut off (WCAG 2.2 1.4.10 Reflow, 2.1.1 Keyboard). The card is
// focusable only while it overflows, so a table that fits adds no tab stop.

const overflowing = async (card: Locator) =>
  card.evaluate((node) => node.scrollWidth > node.clientWidth);

const cards = async (page: Page) => {
  await page.goto("components/patterns/table-set/");
  const all = page.locator(".table-view__card");
  await expect(all.first()).toBeVisible();
  return all;
};

test.describe("Table Set card at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 900 } });

  test("a wide table scrolls inside a focusable named region, not the page", async ({
    page,
    browserName,
  }) => {
    const all = await cards(page);
    let wide: Locator | null = null;
    for (let i = 0; i < (await all.count()); i += 1) {
      const card = all.nth(i);
      if (await overflowing(card)) {
        wide = card;
        break;
      }
    }
    expect(wide, "a demo table wider than 320px").not.toBeNull();
    const card = wide!;

    // The page itself holds flat: the table scrolls in its card.
    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(pageOverflow).toBeLessThanOrEqual(1);

    await expect(card).toHaveAttribute("tabindex", "0");
    await expect(card).toHaveAttribute("role", "region");
    await expect(card).toHaveAttribute("aria-label", /\S/);

    // The keyboard reaches it ...
    await card.focus();
    await expect(card).toBeFocused();
    // ... and scrolls it. Playwright's WebKit does not scroll a focused
    // region from the arrow keys, so only the focus is checked there.
    if (browserName === "webkit") return;
    const before = await card.evaluate((node) => node.scrollLeft);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => card.evaluate((node) => node.scrollLeft)).toBeGreaterThan(before);
  });
});

test.describe("Table Set card at a wide viewport", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test("a table that fits is not a tab stop", async ({ page }) => {
    const all = await cards(page);
    for (let i = 0; i < (await all.count()); i += 1) {
      const card = all.nth(i);
      if (await overflowing(card)) continue;
      await expect(card).not.toHaveAttribute("tabindex", /.*/);
      await expect(card).not.toHaveAttribute("role", /.*/);
    }
  });
});
