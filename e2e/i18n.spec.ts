import { expect, test, type Locator, type Page } from "@playwright/test";

// The Locale Provider docs demo: a locale switcher over a Calendar, a text
// field and a portaled Combobox. Direction derives from the locale.
const demo = (page: Page): Locator =>
  page.locator("astro-island").filter({ has: page.getByRole("radio", { name: "Italiano" }) });

const pick = async (page: Page, name: string) => {
  const radio = demo(page).getByRole("radio", { name });
  await radio.locator("xpath=ancestor::label[1]").click();
};

const open = async (page: Page) => {
  await page.goto("components/localization/locale-provider/");
  await demo(page).getByRole("radio", { name: "Italiano" }).scrollIntoViewIfNeeded();
  await expect(demo(page)).not.toHaveAttribute("ssr", "");
};

test.describe("Locale Provider (docs demo)", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("switching the locale reformats labels and dates in place", async ({ page }) => {
    const d = demo(page);
    await expect(d.getByText("June 2026")).toBeVisible();
    await pick(page, "Italiano");
    await expect(d.getByText("giugno 2026")).toBeVisible();
    await expect(d.getByRole("button", { name: "Oggi" })).toBeVisible();
    // The wrapper carries the language for assistive technologies.
    const lang = await d.locator(".ds-locale").getAttribute("lang");
    expect(lang).toBe("it-IT");
  });

  test("an RTL locale derives dir and reaches portaled overlays", async ({ page }) => {
    const d = demo(page);
    await pick(page, "العربية");
    await expect(d.locator(".ds-locale")).toHaveAttribute("dir", "rtl");
    await expect(d.getByRole("button", { name: "اليوم" })).toBeVisible();

    // The combobox listbox portals to <body>: it must keep the scope's
    // direction and language.
    const input = d.getByRole("combobox", { name: "Fruit" });
    await input.click();
    const listbox = page.locator(".combobox__listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute("dir", "rtl");
    await expect(listbox).toHaveAttribute("lang", "ar-EG");
    // No horizontal overflow in the RTL layout.
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noOverflow).toBe(true);
  });

  test("a locale change never remounts inputs or loses drafts", async ({ page }) => {
    const d = demo(page);
    const notes = d.getByRole("textbox", { name: "Notes" });
    await notes.fill("draft text");
    const handle = await notes.elementHandle();
    // The pointer moves to the switcher (a real user action); the locale
    // change itself must keep the same DOM node and its draft.
    await pick(page, "Italiano");
    await expect(d.getByText("giugno 2026")).toBeVisible();
    expect(await handle!.evaluate((el) => el.isConnected)).toBe(true);
    await expect(notes).toHaveValue("draft text");
    // And the input is still immediately usable.
    await notes.focus();
    await notes.press("End");
    await notes.type("!");
    await expect(notes).toHaveValue("draft text!");
  });

  test("stays usable at 320px with expanded text", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "150%";
    });
    const d = demo(page);
    await pick(page, "Italiano");
    await expect(d.getByRole("button", { name: "Oggi" })).toBeVisible();
    await d.getByRole("combobox", { name: "Fruit" }).click();
    await expect(page.getByRole("option", { name: "Fig" })).toBeVisible();
  });
});
