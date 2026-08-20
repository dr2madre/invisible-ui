import { expect, test, type Locator, type Page } from "@playwright/test";

// The Number Field docs demo: a locale switcher over two Svelte fields.
// The independent Svelte consumer for the browser contract; the Vue side
// lives in number-field.spec.ts.

const demo = (page: Page): Locator =>
  page.locator("astro-island").filter({ has: page.getByRole("radio", { name: "Italiano" }) });

const pick = async (page: Page, name: string) => {
  const radio = demo(page).getByRole("radio", { name });
  await radio.locator("xpath=ancestor::label[1]").click();
};

test.beforeEach(async ({ page }) => {
  await page.goto("components/forms/number-field/");
  await demo(page).getByRole("radio", { name: "Italiano" }).scrollIntoViewIfNeeded();
  await expect(demo(page)).not.toHaveAttribute("ssr", "");
});

test("reformats the committed display when the locale changes", async ({ page }) => {
  const priceField = demo(page).getByRole("spinbutton", { name: "Price" });
  await expect(priceField).toHaveValue("12,345.5");
  await pick(page, "Italiano");
  await expect(priceField).toHaveValue("12.345,5");
  await pick(page, "العربية");
  await expect(priceField).toHaveValue("١٢٬٣٤٥٫٥");
});

test("accepts locale typing and steps precisely in the Svelte adapter", async ({ page }) => {
  await pick(page, "Italiano");
  const priceField = demo(page).getByRole("spinbutton", { name: "Price" });
  await priceField.fill("");
  await priceField.pressSequentially("2,5");
  await priceField.press("ArrowUp");
  await expect(priceField).toHaveValue("3");
  await demo(page).getByRole("button", { name: "Increase Price" }).click();
  await expect(priceField).toHaveValue("3,5");
  await expect(priceField).toBeFocused();
});

test("commits a trailing-separator draft on blur, then reformats per locale", async ({ page }) => {
  const priceField = demo(page).getByRole("spinbutton", { name: "Price" });
  await priceField.fill("");
  await priceField.pressSequentially("12.");
  // Clicking the switcher blurs the field: the draft commits as 12, and the
  // new locale reformats the committed value.
  await pick(page, "Italiano");
  await expect(priceField).toHaveValue("12");
});
