import { expect, test } from "@playwright/test";

// The Svelte Date Picker (docs demo) from the keyboard alone (WAI-ARIA combobox
// and dialog patterns): it opens from Enter, Space and ArrowDown on the
// readonly field, focus goes to the selected day, and focus comes back to the
// field after a pick and after the clear button removes itself.

test.describe("Svelte DatePicker from the keyboard (docs demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("components/forms/date-picker/");
    const field = page.getByRole("combobox", { name: "Event date" }).first();
    await field.scrollIntoViewIfNeeded();
    // The island hydrates on visibility; wait for the handlers to be there.
    await expect(field.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  });

  test("opens with Enter, focuses the selected day, and a pick returns focus", async ({ page }) => {
    const field = page.getByRole("combobox", { name: "Event date" }).first();
    await field.focus();
    await page.keyboard.press("Enter");
    const selected = page.locator('[data-date="2026-06-15"]').first();
    await expect(selected).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("Jun 16, 2026");
    await expect(page.getByRole("grid")).toHaveCount(0);
    await expect(field).toBeFocused();
  });

  test("opens with Space and ArrowDown, and Escape returns focus", async ({ page }) => {
    const field = page.getByRole("combobox", { name: "Event date" }).first();
    for (const key of ["Space", "ArrowDown"]) {
      await field.focus();
      await page.keyboard.press(key);
      await expect(page.locator('[data-date="2026-06-15"]').first()).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("grid")).toHaveCount(0);
      await expect(field).toBeFocused();
    }
  });

  test("keeps focus on the field when Clear removes itself", async ({ page }) => {
    const field = page.getByRole("combobox", { name: "Event date" }).first();
    await page.getByRole("button", { name: "Clear date" }).first().click();
    await expect(field).toHaveValue("");
    await expect(field).toBeFocused();
  });
});
