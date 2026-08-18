import { expect, test, type Locator, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// The docs demo: five customers (Ada 1, Grace 2, Alan 3, Katherine 4,
// Edsger 5), sorted by name, three per page, Grace pre-selected. A button
// empties and refills the rows. The page hosts a second, selection-free
// TableSet demo, so every locator is scoped to the selection demo's island.
const selectionDemo = (page: Page): Locator =>
  page.locator("astro-island").filter({ has: page.getByTestId("selection-readout") });

// The checkbox input is visually hidden (sr-only), so pointer interaction goes
// through the wrapping label, like a user clicking the painted box.
const control = (checkbox: Locator) => checkbox.locator("xpath=ancestor::label[1]");

// The demo is a hydrated island with a controlled selection; a click landing
// before hydration is lost. Retry until the toggle sticks, guarded so it
// never double-toggles.
const ensureChecked = async (checkbox: Locator) => {
  await expect(async () => {
    if (!(await checkbox.isChecked())) await control(checkbox).click();
    expect(await checkbox.isChecked()).toBe(true);
  }).toPass({ timeout: 10_000 });
};

test.describe("Svelte TableSet row selection (docs demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("components/patterns/table-set/");
    // A keypress or click landing before hydration toggles the native input
    // without the component noticing. The island hydrates when it becomes
    // visible and Astro then drops its `ssr` attribute; scroll it into view
    // and wait for that before interacting.
    // The island itself is display: contents, so scroll its readout.
    await page.getByTestId("selection-readout").scrollIntoViewIfNeeded();
    await expect(selectionDemo(page)).not.toHaveAttribute("ssr", "");
  });

  test("select-all uses the native indeterminate state on a partial page", async ({ page }) => {
    const demo = selectionDemo(page);
    const selectAll = demo.getByRole("checkbox", { name: "Select all visible rows" });
    await expect(selectAll).not.toBeChecked();
    await expect(selectAll).toHaveJSProperty("indeterminate", false);

    // Ada joins the pre-selected off-page Grace: the page is now partial.
    await ensureChecked(demo.getByRole("checkbox", { name: "Select Ada" }));
    await expect(selectAll).toHaveJSProperty("indeterminate", true);

    // Completing the page flips indeterminate to a full check.
    await control(selectAll).click();
    await expect(selectAll).toBeChecked();
    await expect(selectAll).toHaveJSProperty("indeterminate", false);
    await expect(demo.getByTestId("selection-readout")).toHaveText("Selected: 2, 1, 3, 5");
  });

  test("row checkboxes work with the keyboard alone", async ({ page }) => {
    const demo = selectionDemo(page);
    const ada = demo.getByRole("checkbox", { name: "Select Ada" });
    await expect(async () => {
      if (!(await ada.isChecked())) {
        await ada.focus();
        await page.keyboard.press("Space");
      }
      expect(await ada.isChecked()).toBe(true);
    }).toPass({ timeout: 10_000 });
    await expect(demo.getByTestId("selection-readout")).toHaveText("Selected: 2, 1");
    await ada.focus();
    await page.keyboard.press("Space");
    await expect(ada).not.toBeChecked();
  });

  test("a page change keeps focus and the selection", async ({ page }) => {
    const demo = selectionDemo(page);
    await ensureChecked(demo.getByRole("checkbox", { name: "Select Ada" }));

    // The page count never changes here, so the pager is not remounted and
    // the pressed button keeps focus.
    const pageTwo = demo.getByRole("button", { name: "Go to page 2" });
    await pageTwo.click();
    await expect(pageTwo).toBeFocused();

    // Grace's page: her pre-selected checkbox reflects the retained ids.
    await expect(demo.getByRole("checkbox", { name: "Select Grace" })).toBeChecked();
    await demo.getByRole("button", { name: "Go to page 1" }).click();
    await expect(demo.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
  });

  test("card view stays reachable and named at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const demo = selectionDemo(page);
    const cards = demo.getByRole("radio", { name: "Cards" });
    await expect(async () => {
      if (!(await cards.isChecked())) await control(cards).click();
      expect(await cards.isChecked()).toBe(true);
    }).toPass({ timeout: 10_000 });

    const list = demo.getByRole("list", { name: "Customers" });
    await expect(list).toBeVisible();
    const ada = demo.getByRole("checkbox", { name: "Select Ada" });
    await ensureChecked(ada);

    // The select-all control sits outside the list with a visible label.
    const selectAll = demo.getByRole("checkbox", { name: "Select all visible rows" });
    await expect(selectAll).toBeVisible();
    expect(await list.getByRole("checkbox", { name: "Select all visible rows" }).count()).toBe(0);
  });

  test("selection works in right-to-left writing mode", async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
    const demo = selectionDemo(page);
    const ada = demo.getByRole("checkbox", { name: "Select Ada" });
    await ensureChecked(ada);
    await expect(demo.getByTestId("selection-readout")).toHaveText("Selected: 2, 1");
  });

  test("select-all disables over an empty scope and recovers with the rows", async ({ page }) => {
    const demo = selectionDemo(page);
    const selectAll = demo.getByRole("checkbox", { name: "Select all visible rows" });

    // The button toggles its own name, so a pre-hydration click is retried
    // without ever double-firing.
    await expect(async () => {
      const clear = demo.getByRole("button", { name: "Clear rows" });
      if ((await clear.count()) > 0) await clear.click();
      await expect(selectAll).toBeDisabled({ timeout: 1_000 });
    }).toPass({ timeout: 10_000 });

    // The selection itself is retained while the rows are gone.
    await expect(demo.getByTestId("selection-readout")).toHaveText("Selected: 2");

    // The control must come back to life with the data (a mounted-disabled
    // checkbox once stayed inert forever).
    await demo.getByRole("button", { name: "Load rows" }).click();
    await expect(selectAll).toBeEnabled();
    await control(selectAll).click();
    await expect(demo.getByTestId("selection-readout")).toHaveText("Selected: 2, 1, 3, 5");
  });
});

test.describe("Vue TableSet row selection (harness)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VUE_BASE);
  });

  test("select-all starts disabled without rows and works once they load", async ({ page }) => {
    const selectAll = page.getByRole("checkbox", { name: "Select all visible rows" });
    await expect(selectAll).toBeDisabled();

    await page.getByRole("button", { name: "Load people" }).click();
    await expect(selectAll).toBeEnabled();

    // Page one of two: Ada (1) and Alan (3) in name order.
    await control(selectAll).click();
    await expect(page.getByTestId("selection-readout")).toHaveText("Selected: 1, 3");
    await expect(selectAll).toBeChecked();
  });

  test("a Vue row selects with the keyboard and marks its row", async ({ page }) => {
    await page.getByRole("button", { name: "Load people" }).click();
    const ada = page.getByRole("checkbox", { name: "Select Ada" });
    await ada.focus();
    await page.keyboard.press("Space");
    await expect(ada).toBeChecked();
    await expect(page.locator("tr[data-selected]")).toHaveCount(1);
    const selectAll = page.getByRole("checkbox", { name: "Select all visible rows" });
    await expect(selectAll).toHaveJSProperty("indeterminate", true);
  });
});
