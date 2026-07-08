import { test, expect } from "@playwright/test";

// Loads representative pages in a real browser and asserts the island hydrates
// without throwing — catches SSR/hydration/runtime errors that jsdom can't.
const pages = [
  { path: "", name: "home" },
  { path: "components/forms/button/", name: "Button" },
  { path: "components/feedback/dialog/", name: "Dialog" },
  { path: "components/forms/calendar/", name: "Calendar" },
  { path: "components/forms/combobox/", name: "Combobox" },
  { path: "components/patterns/table-set/", name: "Table Set" },
  { path: "components/forms/time-field/", name: "Time Field" },
];

for (const p of pages) {
  test(`loads without page errors: ${p.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(p.path, { waitUntil: "networkidle" });
    // Component pages embed a live demo (.ds-preview); the home page is a splash.
    const anchor = p.path ? page.locator(".ds-preview").first() : page.locator("main");
    await expect(anchor).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });
}
