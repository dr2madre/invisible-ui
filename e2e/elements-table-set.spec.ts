import { expect, test, type Page } from "@playwright/test";
import { VUE_BASE } from "../playwright.config";

const ELEMENTS_BASE = VUE_BASE.replace("harness.html", "elements-harness.html");

const PEOPLE = {
  columns: [
    { key: "name", header: "Name", sortable: true, hideable: false },
    { key: "age", header: "Age", sortable: true, align: "end" },
    { key: "city", header: "City" },
  ],
  rows: [
    { id: 1, name: "Ada", age: 36, city: "London" },
    { id: 2, name: "Grace", age: 85, city: "New York" },
    { id: 3, name: "Alan", age: 41, city: "London" },
    { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
    { id: 5, name: "Barbara", age: 80, city: "Boston" },
  ],
};

// A controlled consumer: it records every event and feeds the selection back.
const mountSet = async (page: Page, attributes: string, withViews = false) => {
  await page.goto(ELEMENTS_BASE);
  await page.evaluate(
    async ({ attributes, people, withViews }) => {
      await customElements.whenDefined("ds-table-set");
      document.body.innerHTML = `<main><ds-table-set ${attributes}></ds-table-set></main>`;
      const set = document.querySelector("ds-table-set") as HTMLElement & Record<string, unknown>;
      set.getRowLabel = (row: { name: string }) => row.name;
      if (withViews) {
        set.views = [
          { id: "people", label: "People", ...people },
          {
            id: "orders",
            label: "Orders",
            columns: [
              { key: "ref", header: "Reference", sortable: true },
              { key: "total", header: "Total", sortable: true, align: "end" },
            ],
            rows: [
              { id: "A2", ref: "A2", total: 80 },
              { id: "A1", ref: "A1", total: 120 },
            ],
          },
        ];
      } else {
        set.columns = people.columns;
        set.rows = people.rows;
      }
      const log: string[] = [];
      for (const type of ["view-change", "sort-change", "selected-row-ids-change", "page-change"]) {
        set.addEventListener(type, (event) => {
          const detail = (event as CustomEvent).detail;
          log.push(`${type}:${JSON.stringify(detail)}`);
          set.dataset.events = log.join(" ");
          if (type === "selected-row-ids-change") set.selectedRowIds = detail.selectedRowIds;
        });
      }
    },
    { attributes, people: PEOPLE, withViews },
  );
};

const names = (page: Page) =>
  page.locator("tbody tr").evaluateAll((rows) =>
    rows.map((row) => {
      const cells = [...row.querySelectorAll("td")].filter((cell) => !cell.querySelector("input"));
      return cells[0]?.textContent?.trim() ?? "";
    }),
  );

test("sorting from the keyboard reorders the rows and keeps focus on the header", async ({
  page,
}) => {
  await mountSet(page, `title="People" caption="People"`);
  const table = page.getByRole("table", { name: "People" });
  const nameHeader = table.getByRole("columnheader", { name: /Name/ });
  const ageHeader = table.getByRole("columnheader", { name: /Age/ });
  await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
  expect(await names(page)).toEqual(["Ada", "Alan", "Barbara", "Edsger", "Grace"]);

  const nameSort = nameHeader.getByRole("button");
  await nameSort.focus();
  await page.keyboard.press("Enter");
  await expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  await expect.poll(() => names(page)).toEqual(["Grace", "Edsger", "Barbara", "Alan", "Ada"]);
  await expect(nameHeader.getByRole("button")).toBeFocused();

  const ageSort = ageHeader.getByRole("button");
  await ageSort.focus();
  await page.keyboard.press("Space");
  await expect(ageHeader).toHaveAttribute("aria-sort", "ascending");
  await expect(nameHeader).not.toHaveAttribute("aria-sort", /ascending|descending/);
  await expect.poll(() => names(page)).toEqual(["Ada", "Alan", "Edsger", "Barbara", "Grace"]);
  await expect(ageHeader.getByRole("button")).toBeFocused();

  await expect(page.locator("ds-table-set")).toHaveAttribute(
    "data-events",
    'sort-change:{"sort":{"key":"name","direction":"desc"}} ' +
      'sort-change:{"sort":{"key":"age","direction":"asc"}}',
  );
});

test("row selection toggles from the keyboard and survives paging", async ({ page }) => {
  await mountSet(page, `title="People" caption="People" selection-mode="multiple" page-size="2"`);
  const ada = page.getByRole("checkbox", { name: "Select Ada" });
  await ada.focus();
  await page.keyboard.press("Space");
  await expect(ada).toBeChecked();
  await expect(ada).toBeFocused();
  await expect(page.locator("tbody tr[data-selected]")).toHaveCount(1);

  const selectAll = page.getByRole("checkbox", { name: "Select all visible rows" });
  await expect(selectAll).toBeChecked({ indeterminate: true });

  const pager = page.getByRole("navigation", { name: "Table pages" });
  await pager.getByRole("button", { name: "Go to page 2" }).click();
  await expect.poll(() => names(page)).toEqual(["Barbara", "Edsger"]);
  await expect(pager.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const edsger = page.getByRole("checkbox", { name: "Select Edsger" });
  await edsger.focus();
  await page.keyboard.press("Space");
  await expect(edsger).toBeChecked();

  await pager.getByRole("button", { name: "Go to page 1" }).click();
  await expect(page.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
  const events = await page.locator("ds-table-set").getAttribute("data-events");
  expect(events).toContain('selected-row-ids-change:{"selectedRowIds":[1]}');
  expect(events).toContain('page-change:{"page":2}');
  expect(events).toContain('selected-row-ids-change:{"selectedRowIds":[1,4]}');
});

test("tabs switch between views, and the view toggle shows cards", async ({ page }) => {
  await mountSet(page, `title="Workspace" views-label="Data views" allow-view-toggle`, true);
  const tabs = page.getByRole("tablist", { name: "Data views" });
  const people = tabs.getByRole("tab", { name: "People" });
  const orders = tabs.getByRole("tab", { name: "Orders" });
  await expect(people).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("table", { name: "People" })).toBeVisible();

  await people.focus();
  await page.keyboard.press("ArrowRight");
  await expect(orders).toBeFocused();
  await expect(orders).toHaveAttribute("aria-selected", "true");
  const ordersTable = page.getByRole("table", { name: "Orders" });
  await expect(ordersTable).toBeVisible();
  await expect(page.getByRole("table", { name: "People" })).toHaveCount(0);
  // Each view starts from its own default sort.
  await expect(ordersTable.getByRole("columnheader", { name: /Reference/ })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect.poll(() => names(page)).toEqual(["A1", "A2"]);
  await expect(page.locator("ds-table-set")).toHaveAttribute(
    "data-events",
    'view-change:{"id":"orders"}',
  );

  const cards = page.getByRole("radio", { name: "Cards" });
  await page.locator(".segment", { has: cards }).click();
  await expect(cards).toBeChecked();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Orders" }).getByRole("listitem")).toHaveCount(2);
});

test.describe("Elements table set at 320 CSS pixels", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("the page does not scroll sideways; the table scrolls in its own box", async ({ page }) => {
    await mountSet(
      page,
      `title="People" caption="People" configurable allow-view-toggle selection-mode="multiple" page-size="2"`,
    );
    await expect(page.getByRole("table", { name: "People" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Table pages" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await expect(page.getByRole("button", { name: "Columns" })).toBeInViewport();
    const cards = page.getByRole("radio", { name: "Cards" });
    await expect(page.locator(".segment", { has: cards })).toBeInViewport();
  });
});
