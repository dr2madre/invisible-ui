import { expect, test, type Locator, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// Svelte side: the docs demo (six people, Grace preselected, Alan disabled,
// Backspace removal opted in, a real form with a submit readout).
const demo = (page: Page): Locator =>
  page.locator("astro-island").filter({ has: page.getByTestId("submitted-readout") });

const openDocs = async (page: Page) => {
  await page.goto("components/forms/multi-select/");
  await page.getByTestId("submitted-readout").scrollIntoViewIfNeeded();
  await expect(demo(page)).not.toHaveAttribute("ssr", "");
};

test.describe("Svelte MultiSelect (docs demo)", () => {
  test.beforeEach(async ({ page }) => {
    await openDocs(page);
  });

  test("keyboard selection keeps focus on the input via activedescendant", async ({ page }) => {
    const d = demo(page);
    const input = d.getByRole("combobox", { name: "People" });
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-expanded", "true");
    const active = await input.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    // The referenced option really exists.
    expect(await page.locator(`#${active}`).count()).toBe(1);

    await page.keyboard.press("Enter");
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(d.getByRole("button", { name: "Remove Ada Lovelace" })).toBeVisible();

    // Tab closes the popup and moves on through ordinary tab stops.
    await page.keyboard.press("Tab");
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).not.toBeFocused();
  });

  test("removal moves focus to the next, previous, then the input", async ({ page }) => {
    const d = demo(page);
    const input = d.getByRole("combobox", { name: "People" });
    // Add two more people around the preselected Grace.
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await input.fill("Bar");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");

    // Tags: Grace, Ada, Barbara. Remove the middle one with its button.
    const removeAda = d.getByRole("button", { name: "Remove Ada Lovelace" });
    await removeAda.focus();
    await page.keyboard.press("Enter");
    await expect(d.getByRole("button", { name: "Remove Barbara Liskov" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(d.getByRole("button", { name: "Remove Grace Hopper" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(input).toBeFocused();
  });

  test("Backspace in the empty input removes the last removable value", async ({ page }) => {
    const d = demo(page);
    const input = d.getByRole("combobox", { name: "People" });
    await input.focus();
    await page.keyboard.press("Backspace");
    await expect(d.getByRole("button", { name: "Remove Grace Hopper" })).toHaveCount(0);
    await expect(input).toBeFocused();
  });

  test("disabled options add nothing; Escape and outside press close", async ({ page }) => {
    const d = demo(page);
    const input = d.getByRole("combobox", { name: "People" });
    await input.click();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    // Playwright refuses aria-disabled targets; force simulates the tap.
    await page.getByRole("option", { name: "Alan Turing" }).click({ force: true });
    await expect(d.getByRole("button", { name: "Remove Alan Turing" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).toBeFocused();

    await input.click();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await d.getByTestId("submitted-readout").click();
    await expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("submits FormData.getAll in selection order", async ({ page }) => {
    const d = demo(page);
    const input = d.getByRole("combobox", { name: "People" });
    await input.click();
    await page.getByRole("option", { name: "Edsger Dijkstra" }).click();
    await page.keyboard.press("Escape");
    await d.getByRole("button", { name: "Submit" }).click();
    await expect(d.getByTestId("submitted-readout")).toHaveText("Submitted: grace, edsger");
  });

  test("selected option stays listed and marked; reselection is a no-op", async ({ page }) => {
    const d = demo(page);
    const input = d.getByRole("combobox", { name: "People" });
    await input.click();
    const grace = page.getByRole("option", { name: "Grace Hopper" });
    await expect(grace).toHaveAttribute("aria-selected", "true");
    await grace.click();
    await expect(d.getByRole("button", { name: "Remove Grace Hopper" })).toHaveCount(1);
  });

  test("wraps at 320px without horizontal scrolling and works in RTL", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
    const d = demo(page);
    const input = d.getByRole("combobox", { name: "People" });
    await input.click();
    await page.getByRole("option", { name: "Katherine Johnson" }).click();
    await page.getByRole("option", { name: "Edsger Dijkstra" }).click();
    await page.keyboard.press("Escape");
    await expect(d.getByRole("list", { name: "Selected values" })).toBeVisible();
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noOverflow).toBe(true);

    // Remove targets stay usable (WCAG 2.5.8: at least 24x24).
    const box = await d.getByRole("button", { name: "Remove Grace Hopper" }).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
    await d.getByRole("button", { name: "Remove Grace Hopper" }).click();
    await expect(d.getByRole("button", { name: "Remove Grace Hopper" })).toHaveCount(0);
  });

  test("touch selects options and removes tags", async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true });
    const page = await context.newPage();
    await openDocs(page);
    const d = demo(page);
    await d.getByRole("combobox", { name: "People" }).tap();
    await page.getByRole("option", { name: "Edsger Dijkstra" }).tap();
    await expect(d.getByRole("button", { name: "Remove Edsger Dijkstra" })).toBeVisible();
    await d.getByRole("button", { name: "Remove Edsger Dijkstra" }).tap();
    await expect(d.getByRole("button", { name: "Remove Edsger Dijkstra" })).toHaveCount(0);
    await context.close();
  });
});

test.describe("Vue MultiSelect (harness)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VUE_BASE);
  });

  test("keyboard selection, focus after removal and Backspace parity", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Skills" });
    await input.focus();
    await page.keyboard.press("ArrowDown");
    const active = await input.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(await page.locator(`#${active}`).count()).toBe(1);
    await page.keyboard.press("Enter");
    await expect(input).toBeFocused();
    await expect(page.getByRole("button", { name: "Remove Svelte" })).toBeVisible();

    // Remove the first tag: focus lands on the next remove button.
    const removeVue = page.getByRole("button", { name: "Remove Vue" });
    await removeVue.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Remove Svelte" })).toBeFocused();

    // Backspace (opted in) removes the last removable value.
    await input.focus();
    await page.keyboard.press("Backspace");
    await expect(page.getByRole("button", { name: "Remove Svelte" })).toHaveCount(0);
  });

  test("submits FormData.getAll order and skips disabled options", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Skills" });
    await input.click();
    await page.getByRole("option", { name: "Reflex" }).click({ force: true });
    await expect(page.getByRole("button", { name: "Remove Reflex" })).toHaveCount(0);
    await page.getByRole("option", { name: "Elements" }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Submit skills" }).click();
    await expect(page.getByTestId("skills-readout")).toHaveText("Submitted: vue, elements");
  });
});
