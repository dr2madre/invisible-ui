import { expect, test, type Locator, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// The docs demo: six customers, three per page, a city filter in the toolbar.
// Locators are scoped to the filter demo's island via its readout.
const filterDemo = (page: Page): Locator =>
  page.locator("astro-island").filter({ has: page.getByTestId("filter-readout") });

test.describe("Svelte TableSet filtering coordination (docs demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("components/patterns/table-set/");
    await page.getByTestId("filter-readout").scrollIntoViewIfNeeded();
    await expect(filterDemo(page)).not.toHaveAttribute("ssr", "");
  });

  test("no-results appears with a status role and clears back to content", async ({ page }) => {
    const demo = filterDemo(page);
    await expect(demo.getByRole("table", { name: "Customers" })).toBeVisible();
    expect(await demo.locator("[role='status']").count()).toBe(0);

    await demo.getByRole("textbox", { name: "Filter by city" }).fill("zzz");
    const panel = demo.locator("[role='status']");
    await expect(panel).toHaveCount(1);
    await expect(panel).toContainText("No rows match the current filters");
    await expect(demo.getByRole("table")).toHaveCount(0);
    // No live region wraps the table area beyond the panel itself.
    expect(await demo.locator("[aria-live]").count()).toBe(0);

    await demo.getByRole("button", { name: "Clear filters" }).click();
    await expect(demo.getByRole("table", { name: "Customers" })).toBeVisible();
    // Focus lands on the view container: the pressed button is gone.
    await expect(demo.locator(".table-view")).toBeFocused();
  });

  test("a filter change resets the page once and keeps the selection", async ({ page }) => {
    const demo = filterDemo(page);
    // Select Ada on page one, move to page two.
    await demo
      .getByRole("checkbox", { name: "Select Ada" })
      .locator("xpath=ancestor::label[1]")
      .click();
    await demo.getByRole("button", { name: "Go to page 2" }).click();
    await expect(demo.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Typing a filter resets to page one; the selection survives.
    await demo.getByRole("textbox", { name: "Filter by city" }).fill("o");
    await expect(demo.getByRole("button", { name: "Go to page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(demo.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
    await expect(demo.getByTestId("filter-readout")).toHaveText("Selected: 1");
  });
});

test.describe("Vue TableSet filtering coordination (harness)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VUE_BASE);
  });

  test("empty dataset and no-results stay distinct states", async ({ page }) => {
    const filter = page.getByRole("textbox", { name: "Filter by city" });
    // Before loading, the dataset is empty: filtering must not claim
    // "no results".
    await filter.fill("zzz");
    await expect(page.getByRole("table", { name: "People" })).toBeVisible();
    expect(await page.locator("[role='status']").count()).toBe(0);

    // With data loaded, the same filter is a genuine no-results state.
    await page.getByRole("button", { name: "Load people" }).click();
    const panel = page.locator("[role='status']");
    await expect(panel).toHaveCount(1);
    await expect(panel).toContainText("No rows match the current filters");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByRole("table", { name: "People" })).toBeVisible();
    await expect(page.locator(".table-view")).toBeFocused();
  });
});
