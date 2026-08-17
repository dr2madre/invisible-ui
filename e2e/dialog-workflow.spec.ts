import { expect, test, type Page } from "@playwright/test";

// The two-step workflow demo on the Dialog page. These contracts depend on real
// focus, real layout and a real scrolling region, which jsdom cannot prove.
const openWorkflow = async (page: Page) => {
  await page.goto("components/feedback/dialog/");
  const trigger = page.getByRole("button", { name: "Set up project" });
  // The demo is a hydrated island; a click before hydration is lost.
  await expect(async () => {
    if (!(await page.getByRole("dialog").isVisible())) await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 12_000 });
  return trigger;
};

test("moves focus to the heading of each step, and never onto a removed control", async ({
  page,
}) => {
  await openWorkflow(page);
  await expect(page.getByRole("heading", { name: "Choose a template" })).toBeFocused();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Name the project" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { name: "Choose a template" })).toBeFocused();
});

test("keeps the step context and a dismissal control at every step", async ({ page }) => {
  await openWorkflow(page);
  const panel = page.getByRole("dialog");
  const dismiss = panel.locator("button.dialog__close");

  await expect(panel.locator(".dialog__header-meta")).toHaveText("Step 1 of 2");
  await expect(dismiss).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(panel.locator(".dialog__header-meta")).toHaveText("Step 2 of 2");
  await expect(dismiss).toBeVisible();
});

// Safari only tabs to buttons when the system enables full keyboard access, so
// the Tab traversal is checked on the engines where it is reliable. DOM order
// and visual order are checked everywhere.
const tabReachesButtons = (browserName: string) => browserName !== "webkit";

test("keeps footer actions in one bar, in source order, with Back at the logical start", async ({
  page,
  browserName,
}) => {
  await openWorkflow(page);
  await page.getByRole("button", { name: "Continue" }).click();
  const panel = page.getByRole("dialog");

  await expect(panel.locator("footer")).toHaveCount(1);
  const back = panel.getByRole("button", { name: "Back" });
  const primary = panel.getByRole("button", { name: "Create project" });

  // Back comes first in the DOM, which is the order focus follows.
  const backFirst = await panel.evaluate((node) => {
    const buttons = Array.from(node.querySelectorAll("footer button"));
    const first = buttons.findIndex((b) => b.textContent?.trim() === "Back");
    const last = buttons.findIndex((b) => b.textContent?.trim() === "Create project");
    return first >= 0 && last >= 0 && first < last;
  });
  expect(backFirst).toBe(true);

  // Left-to-right page: the visual order matches, so it never contradicts focus.
  const backBox = (await back.boundingBox())!;
  const primaryBox = (await primary.boundingBox())!;
  expect(backBox.x).toBeLessThan(primaryBox.x);

  if (tabReachesButtons(browserName)) {
    await back.focus();
    await page.keyboard.press("Tab");
    await expect(primary).toBeFocused();
  }
});

test("scrolls the body only, leaving the header and footer in place", async ({ page }) => {
  // A short viewport makes the panel shorter than its content, which is the
  // case this contract is about.
  await page.setViewportSize({ width: 1024, height: 520 });
  await openWorkflow(page);
  const panel = page.getByRole("dialog");
  const body = panel.locator(".dialog__body");

  const headerBefore = (await panel.locator("header").boundingBox())!;
  const footerBefore = (await panel.locator("footer").boundingBox())!;
  await body.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));

  expect(await body.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  expect((await panel.locator("header").boundingBox())!.y).toBe(headerBefore.y);
  expect((await panel.locator("footer").boundingBox())!.y).toBe(footerBefore.y);
});

test("keeps focus visible inside the body, not hidden under the header or footer", async ({
  page,
}) => {
  await openWorkflow(page);
  const panel = page.getByRole("dialog");
  const body = panel.locator(".dialog__body");
  const field = panel.getByRole("combobox");

  await field.focus();
  const fieldBox = (await field.boundingBox())!;
  const bodyBox = (await body.boundingBox())!;
  // Focusing a body control scrolls it into the body viewport, and the fixed
  // header and footer never cover it.
  expect(fieldBox.y).toBeGreaterThanOrEqual(bodyBox.y - 1);
  expect(fieldBox.y + fieldBox.height).toBeLessThanOrEqual(bodyBox.y + bodyBox.height + 1);
});

test("stays operable at a 320 pixel viewport without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openWorkflow(page);
  const panel = page.getByRole("dialog");

  const overflowsSideways = await panel.evaluate((node) => node.scrollWidth > node.clientWidth + 1);
  expect(overflowsSideways).toBe(false);

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Name the project" })).toBeFocused();
  await expect(panel.getByRole("button", { name: "Create project" })).toBeVisible();
  await expect(panel.locator("button.dialog__close")).toBeVisible();
});

test("places the leading action at the logical start in a right-to-left layout", async ({
  page,
  browserName,
}) => {
  await openWorkflow(page);
  await page.getByRole("button", { name: "Continue" }).click();
  const panel = page.getByRole("dialog");
  await panel.evaluate((node) => node.setAttribute("dir", "rtl"));

  const back = panel.getByRole("button", { name: "Back" });
  const primary = panel.getByRole("button", { name: "Create project" });
  const backBox = (await back.boundingBox())!;
  const primaryBox = (await primary.boundingBox())!;

  // The logical start is now on the right, and the DOM order is unchanged.
  expect(backBox.x).toBeGreaterThan(primaryBox.x);

  if (tabReachesButtons(browserName)) {
    await back.focus();
    await page.keyboard.press("Tab");
    await expect(primary).toBeFocused();
  }
});
