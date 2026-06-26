import { test, expect } from "@playwright/test";

test("Dialog opens from its trigger and closes on Escape", async ({ page }) => {
  await page.goto("components/dialog/");
  await page.getByRole("button", { name: "Open dialog" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Calendar navigates to the next month", async ({ page }) => {
  await page.goto("components/calendar/");
  const title = page.locator(".calendar__title").first();
  const before = await title.textContent();
  await page.getByRole("button", { name: "Next" }).first().click();
  await expect(title).not.toHaveText(before ?? "");
});

test("Switch toggles on click", async ({ page }) => {
  await page.goto("components/switch/");
  const bluetooth = page.getByRole("switch", { name: "Bluetooth" });
  await expect(bluetooth).toHaveAttribute("aria-checked", "false");
  await bluetooth.click();
  await expect(bluetooth).toHaveAttribute("aria-checked", "true");
});

test("Combobox filters and selects an option", async ({ page }) => {
  await page.goto("components/combobox/");
  const input = page.getByRole("combobox", { name: "Fruit" });
  await input.click();
  await input.fill("ch");
  await page.getByRole("option", { name: "Cherry" }).click();
  await expect(input).toHaveValue("Cherry");
});
