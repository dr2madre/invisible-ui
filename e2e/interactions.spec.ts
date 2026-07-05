import { test, expect } from "@playwright/test";

test("Dialog opens from its trigger and closes on Escape", async ({ page }) => {
  await page.goto("components/feedback/dialog/");
  await page.getByRole("button", { name: "Open dialog" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Calendar navigates to the next month", async ({ page }) => {
  await page.goto("components/date-time/calendar/");
  const title = page.locator(".calendar__title").first();
  const next = page.getByRole("button", { name: "Next" }).first();
  const before = (await title.textContent()) ?? "";
  // client:visible island — a click before hydration is lost; retry until the
  // month advances (idempotent: only clicks while the title is unchanged).
  await expect(async () => {
    if ((await title.textContent()) === before) await next.click();
    await expect(title).not.toHaveText(before, { timeout: 2_000 });
  }).toPass({ timeout: 12_000 });
});

test("Switch toggles on click", async ({ page }) => {
  await page.goto("components/forms/switch/");
  const bluetooth = page.getByRole("switch", { name: "Bluetooth" });
  // The Switch is a native <input type="checkbox" role="switch">; state is
  // conveyed by the native checked property, not aria-checked (see
  // core/src/switch/connect.ts). The input is visually hidden (sr-only), so
  // toggle it via the wrapping label, like a user clicking the control.
  const control = bluetooth.locator("xpath=ancestor::label[1]");
  await expect(bluetooth).not.toBeChecked();
  // The demo is a hydrated Svelte island with a controlled `checked`; a click
  // landing before hydration is lost (the controlled value resets it). Retry
  // the click until the toggle sticks — guarded so it never double-toggles.
  await expect(async () => {
    if (!(await bluetooth.isChecked())) await control.click();
    expect(await bluetooth.isChecked()).toBe(true);
  }).toPass({ timeout: 10_000 });
});

test("Combobox filters and selects an option", async ({ page }) => {
  await page.goto("components/forms/combobox/");
  const input = page.getByRole("combobox", { name: "Fruit" });
  await input.click();
  await input.fill("ch");
  await page.getByRole("option", { name: "Cherry" }).click();
  await expect(input).toHaveValue("Cherry");
});
