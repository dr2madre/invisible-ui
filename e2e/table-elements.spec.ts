import { expect, test } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

test("Elements Table keeps native semantics and reports controlled sorting", async ({ page }) => {
  await page.goto(VUE_BASE.replace("harness.html", "elements-harness.html"));
  await page.evaluate(async () => {
    await customElements.whenDefined("ds-table");
    document.body.innerHTML = `<ds-table caption="People"></ds-table>`;
    const table = document.querySelector("ds-table") as HTMLElement & {
      columns: Array<{ key: string; header: string; sortable?: boolean; align?: string }>;
      rows: Array<Record<string, unknown>>;
      sort: { key: string; direction: "asc" | "desc" } | null;
    };
    table.columns = [
      { key: "name", header: "Name", sortable: true },
      { key: "age", header: "Age", align: "end" },
    ];
    table.rows = [
      { id: 1, name: "Ada", age: 36 },
      { id: 2, name: "Grace", age: 85 },
    ];
    table.style.setProperty("--ds-table-header-background", "rgb(238, 233, 248)");
    table.addEventListener("sort-toggle", (event) => {
      const key = (event as CustomEvent<{ key: string }>).detail.key;
      table.dataset.requestedSort = key;
      table.sort = { key, direction: "asc" };
    });
  });

  const table = page.getByRole("table", { name: "People" });
  await expect(table).toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(3);
  await expect(table.getByRole("cell", { name: "Ada" })).toBeVisible();
  const nameHeader = table.getByRole("columnheader", { name: /Name/ });
  await expect(nameHeader).toHaveCSS("background-color", "rgb(238, 233, 248)");
  await nameHeader.getByRole("button").click();
  await expect(page.locator("ds-table")).toHaveAttribute("data-requested-sort", "name");
  await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
});
