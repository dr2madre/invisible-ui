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

  // The label is the live text; the visible number is hidden from the tree.
  await expect(page.getByRole("status")).toHaveText("3 pending updates");
  await expect(page.locator("ds-count .count")).toHaveText("3");
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

test("Elements composed tabs line up with a header beside the strip", async ({ page }) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await Promise.all(
      ["ds-tabs", "ds-tab-list", "ds-tab", "ds-tab-panel"].map((tag) =>
        customElements.whenDefined(tag),
      ),
    );
    document.body.innerHTML = `
      <ds-tabs value="form">
        <header data-header style="display: flex; align-items: center; gap: 1rem">
          <ds-tab-list label="Editor">
            <ds-tab value="form">Form</ds-tab>
            <ds-tab value="preview">Preview</ds-tab>
          </ds-tab-list>
          <button type="button">Close</button>
        </header>
        <ds-tab-panel value="form"><div style="block-size: 20rem">Form fields</div></ds-tab-panel>
        <ds-tab-panel value="preview">Rendered preview</ds-tab-panel>
      </ds-tabs>`;
  });

  const strip = await page.getByRole("tablist", { name: "Editor" }).boundingBox();
  const close = await page.getByRole("button", { name: "Close" }).boundingBox();
  const header = await page.locator("[data-header]").boundingBox();
  // The header holds the strip alone, so the button sits level with the tabs.
  expect(header!.height).toBeLessThan(strip!.height + 4);
  expect(Math.abs(close!.y + close!.height / 2 - (strip!.y + strip!.height / 2))).toBeLessThan(4);

  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.getByRole("tabpanel")).toHaveText("Rendered preview");
  await expect(page.getByText("Form fields")).toBeHidden();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "Form" })).toBeFocused();
  await expect(page.getByText("Form fields")).toBeVisible();
});

const openActions = async (page: import("@playwright/test").Page, dir = "ltr") => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async (dir) => {
    await Promise.all(["ds-tabs", "ds-button"].map((tag) => customElements.whenDefined(tag)));
    document.documentElement.dir = dir;
    document.body.innerHTML = `
      <ds-tabs label="Views">
        <ds-button slot="actions" icon-only variant="ghost" aria-label="Add view">+</ds-button>
      </ds-tabs>`;
    const tabs = document.querySelector("ds-tabs") as HTMLElement & {
      items: Array<{ value: string; label: string; content: string }>;
      value: string | null;
    };
    tabs.items = [
      { value: "list", label: "List", content: "List view." },
      { value: "grid", label: "Grid", content: "Grid view." },
    ];
    tabs.querySelector("ds-button")!.addEventListener("click", () => {
      const number = tabs.items.length + 1;
      const value = `view-${number}`;
      tabs.items = [...tabs.items, { value, label: `View ${number}`, content: `View ${number}.` }];
      tabs.value = value;
    });
  }, dir);
};

test("Elements Tabs actions sit after the tablist, outside it, on the same row", async ({
  page,
}) => {
  await openActions(page);
  const list = page.getByRole("tablist", { name: "Views" });
  const add = page.getByRole("button", { name: "Add view" });
  await expect(list.getByRole("button", { name: "Add view" })).toHaveCount(0);
  await expect(page.getByRole("tab")).toHaveCount(2);

  const strip = (await list.boundingBox())!;
  const button = (await add.boundingBox())!;
  expect(button.x).toBeGreaterThanOrEqual(strip.x + strip.width);
  expect(button.y + button.height).toBeGreaterThan(strip.y);
  expect(button.y).toBeLessThan(strip.y + strip.height);

  // The arrows stay in the tablist; Tab moves on to the action.
  await page.getByRole("tab", { name: "List" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "List" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(add).toBeFocused();

  // Enter on the action adds and selects a tab; focus stays on the action.
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tab")).toHaveCount(4);
  await expect(page.getByRole("tab", { name: "View 4" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveText("View 4.");
  await expect(add).toBeFocused();
});

test("Elements Tabs actions follow the tablist right to left", async ({ page }) => {
  await openActions(page, "rtl");
  const strip = (await page.getByRole("tablist", { name: "Views" }).boundingBox())!;
  const button = (await page.getByRole("button", { name: "Add view" }).boundingBox())!;
  expect(button.x + button.width).toBeLessThanOrEqual(strip.x);
});

test("Elements Tabs actions wrap below the tablist at 320 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openActions(page);
  const add = page.getByRole("button", { name: "Add view" });
  for (let i = 0; i < 4; i++) await add.click();
  const strip = (await page.getByRole("tablist", { name: "Views" }).boundingBox())!;
  const button = (await add.boundingBox())!;
  expect(button.y).toBeGreaterThanOrEqual(strip.y + strip.height - 1);
  expect(button.x + button.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
