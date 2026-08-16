import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

// These tests drive the Vue harness page, never the Svelte documentation site,
// so they exercise the Vue adapter in a real browser.
test.beforeEach(async ({ page }) => {
  await page.goto(VUE_BASE);
});

test("Vue Popover moves focus to its first control on open", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Open popover" });
  await trigger.click();

  await expect(page.getByRole("button", { name: "Action" })).toBeFocused();
});

test("Vue Popover closes on Escape and returns focus to the trigger", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Open popover" });
  const panel = page.locator(".popover__content");
  await trigger.click();
  await expect(panel).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Vue Popover closes on an outside press without restoring focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Open popover" });
  const panel = page.locator(".popover__content");
  await trigger.click();
  await expect(panel).toBeVisible();

  await page.getByRole("heading", { name: "Vue adapter harness" }).click();
  await expect(panel).toBeHidden();
  await expect(trigger).not.toBeFocused();
});

test("Vue Popover closes when focus leaves it, leaving focus where it went", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Open popover" });
  const panel = page.locator(".popover__content");
  await trigger.click();
  await expect(panel).toBeVisible();

  const outside = page.getByRole("link", { name: "After" });
  await outside.focus();
  await expect(panel).toBeHidden();
  await expect(outside).toBeFocused();
  await expect(trigger).not.toBeFocused();
});
