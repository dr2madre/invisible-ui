import { expect, test, type Page } from "@playwright/test";

// Two lifecycle questions only a real browser answers: whether a floating
// panel's subscription really unwinds when it closes, and whether nested
// modals give the page back exactly as they found it.
//
// Two others were asked here and moved: pointer capture during an interrupted
// drag belongs to the browser, which releases it when the node leaves the
// document, and there is no library state to leak; and what a component does
// after it is taken away is a timer question, answered where timers can be
// controlled (see `notification.test.ts` and `loading.test.ts`).
test.skip(({ browserName }) => browserName !== "chromium", "one engine is enough");

/**
 * Count what the page subscribes to and never lets go of: listeners on window
 * and document by type and capture flag, and live observers by kind. The
 * capture flag is part of the key because removing with the wrong one leaves
 * the listener in place, and observers are counted because a floating panel
 * watches sizes and intersections, not only scroll and resize.
 */
const countSubscriptions = async (page: Page) =>
  page.addInitScript(() => {
    const tally: Record<string, number> = {};
    (window as unknown as { __subs: Record<string, number> }).__subs = tally;
    const bump = (key: string, by: number) => {
      tally[key] = (tally[key] ?? 0) + by;
    };
    const captured = (options: unknown) =>
      options === true ||
      (typeof options === "object" && options !== null && "capture" in options
        ? Boolean((options as { capture?: unknown }).capture)
        : false);

    for (const [name, target] of [
      ["window", window],
      ["document", document],
    ] as const) {
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      target.addEventListener = ((type: string, listener: unknown, options: unknown) => {
        bump(`${name}:${type}:${captured(options)}`, 1);
        return (add as (...args: unknown[]) => void)(type, listener, options);
      }) as typeof target.addEventListener;
      target.removeEventListener = ((type: string, listener: unknown, options: unknown) => {
        bump(`${name}:${type}:${captured(options)}`, -1);
        return (remove as (...args: unknown[]) => void)(type, listener, options);
      }) as typeof target.removeEventListener;
    }

    for (const kind of ["ResizeObserver", "IntersectionObserver", "MutationObserver"] as const) {
      const Original = window[kind];
      if (!Original) continue;
      class Counted extends (Original as unknown as { new (...args: unknown[]): object }) {
        constructor(...args: unknown[]) {
          super(...args);
          bump(`observer:${kind}`, 1);
        }
        disconnect(...args: unknown[]) {
          bump(`observer:${kind}`, -1);
          return (super.disconnect as (...rest: unknown[]) => void)(...args);
        }
      }
      (window as unknown as Record<string, unknown>)[kind] = Counted;
    }
  });

const subscriptions = (page: Page) =>
  page.evaluate(() => ({ ...(window as unknown as { __subs: Record<string, number> }).__subs }));

test("a popover opened and closed many times leaves nothing behind", async ({ page }) => {
  await countSubscriptions(page);
  await page.goto("components/data-layout/popover/");
  const trigger = page.getByRole("button", { name: "Open popover", exact: true }).first();
  await expect(trigger).toBeVisible();
  const panel = page.getByRole("dialog").first();

  // The trigger ignores a click that lands within 350 ms of the last one it
  // took, so a tight loop opens the panel once and measures nothing. Each
  // cycle waits for the panel and is counted, and the count is asserted.
  const cycle = async () => {
    await page.waitForTimeout(400);
    await trigger.click();
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
  };

  await cycle();
  const settled = await subscriptions(page);
  const CYCLES = 12;
  for (let i = 0; i < CYCLES; i += 1) await cycle();
  const after = await subscriptions(page);

  // Twelve more cycles must leave what one cycle left: anything that grows is
  // something an open panel took and a closed one kept.
  const grown = Object.entries(after)
    .filter(([key, count]) => count > (settled[key] ?? 0))
    .map(([key, count]) => `${key}: ${settled[key] ?? 0} -> ${count}`);
  expect(grown, grown.join("\n")).toEqual([]);
  // And the measurement is not empty: an open panel does subscribe to things.
  expect(
    Object.values(settled).filter((count) => count > 0).length,
    "one cycle subscribed to nothing, so nothing was being watched",
  ).toBeGreaterThan(0);
});

test("two dialogs restore the page they found", async ({ page }) => {
  await page.goto("components/feedback/dialog/");
  const scrolled = async () => {
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(100);
    return page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
  };
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await scrolled(), "the page must be able to scroll to begin with").toBeGreaterThan(0);
  const before = await page.evaluate(() => ({
    overflow: document.body.style.overflow,
    padding: document.body.style.paddingRight,
  }));

  await page.getByRole("button", { name: "Edit profile" }).first().click();
  await expect(page.getByRole("dialog", { name: "Edit profile" })).toBeVisible();
  const held = await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
  expect(await scrolled(), "an open modal holds the page still").toBe(held);

  // A second modal on top of the first, which is what the counting is for.
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Discard changes?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Discard changes?" })).toHaveCount(0);
  expect(await scrolled(), "the dialog underneath is still open").toBe(held);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const after = await page.evaluate(() => ({
    overflow: document.body.style.overflow,
    padding: document.body.style.paddingRight,
  }));
  expect(after, "and gives the page back exactly as it was").toEqual(before);
  expect(await scrolled(), "the page scrolls again").toBeGreaterThan(held);
});
