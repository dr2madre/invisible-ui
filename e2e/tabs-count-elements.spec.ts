import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const openFixture = async (page: import("@playwright/test").Page) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await Promise.all([
      customElements.whenDefined("ds-tabs"),
      customElements.whenDefined("ds-count"),
    ]);
    document.body.innerHTML = `
      <ds-tabs label="Catalog"></ds-tabs>
      <ds-count count="3" label="3 pending updates"></ds-count>
    `;
    const tabs = document.querySelector("ds-tabs") as HTMLElement & {
      items: Array<{
        value: string;
        label: string;
        content: string;
        count?: number;
        disabled?: boolean;
      }>;
      value: string | null;
    };
    tabs.items = [
      { value: "tables", label: "Tables", content: "Table list", count: 11 },
      { value: "columns", label: "Columns", content: "Column list", count: 42 },
      { value: "disabled", label: "Disabled", content: "Unavailable", disabled: true },
    ];
    tabs.addEventListener("change", (event) => {
      tabs.dataset.reportedValue = (event as CustomEvent<{ value: string }>).detail.value;
    });
  });
};

test("Elements Tabs keeps browser focus, selection and count semantics", async ({ page }) => {
  await openFixture(page);
  const list = page.getByRole("tablist", { name: "Catalog" });
  const tables = page.getByRole("tab", { name: "Tables" });
  const columns = page.getByRole("tab", { name: "Columns" });

  await expect(list).toBeVisible();
  await expect(tables).toContainText("11");
  await tables.focus();
  await page.keyboard.press("ArrowRight");
  await expect(columns).toBeFocused();
  await expect(columns).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveText("Column list");
  await expect(page.locator("ds-tabs")).toHaveAttribute("data-reported-value", "columns");

  await expect(page.getByRole("status", { name: "3 pending updates" })).toHaveText("3");
});

test("Elements Tabs remains reachable at 320 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openFixture(page);
  const lastEnabled = page.getByRole("tab", { name: "Columns" });
  await page.getByRole("tab", { name: "Tables" }).focus();
  await page.keyboard.press("End");
  await expect(lastEnabled).toBeFocused();
  await expect(lastEnabled).toHaveAttribute("aria-selected", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
