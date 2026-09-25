import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsTable, TableColumnDef, TableRow } from "./ds-table";

const columns: TableColumnDef[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", sortable: true, align: "end" },
  { key: "city", header: "City" },
];
const rows: TableRow[] = [
  { id: 1, name: "Ada", age: 36, city: "London" },
  { id: 2, name: "Grace", age: 85, city: "New York" },
  { id: 3, name: "alan", age: 41, city: "London" },
];

const mount = (attributes = "") => {
  const table = document.createElement("ds-table") as DsTable;
  table.setAttribute("caption", "People");
  if (attributes) table.setAttribute(attributes, "");
  table.columns = columns;
  table.rows = rows;
  document.body.appendChild(table);
  return table;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-table>", () => {
  it("renders a captioned native table with controlled rows", () => {
    mount();
    expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(
      Array.from(document.querySelectorAll("tbody tr td:first-child"), (cell) => cell.textContent),
    ).toEqual(["Ada", "Grace", "alan"]);
  });

  it("reflects sort state and emits one sort-toggle without reordering", async () => {
    const user = userEvent.setup();
    const table = mount();
    table.sort = { key: "name", direction: "asc" };
    const events: string[] = [];
    table.addEventListener("sort-toggle", (event) =>
      events.push((event as CustomEvent<{ key: string }>).detail.key),
    );

    const header = within(table).getByRole("columnheader", { name: /Name/ });
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(within(table).getByRole("columnheader", { name: "City" })).not.toHaveAttribute(
      "aria-sort",
    );
    await user.click(within(header).getByRole("button"));
    expect(events).toEqual(["name"]);
    expect(table.querySelector("tbody td")?.textContent).toBe("Ada");
  });

  it("keeps focus on the sort button of the same column across a render", async () => {
    const user = userEvent.setup();
    const table = mount();
    table.addEventListener("sort-toggle", (event) => {
      table.sort = { key: (event as CustomEvent<{ key: string }>).detail.key, direction: "asc" };
    });
    const button = () =>
      within(within(table).getByRole("columnheader", { name: /Age/ })).getByRole("button");
    await user.click(button());
    expect(within(table).getByRole("columnheader", { name: /Age/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(button()).toHaveFocus();
  });

  it("renders custom cells as DOM or text without parsing strings as markup", () => {
    const table = mount();
    table.renderCell = ({ column, value }) => {
      if (column.key === "name") {
        const strong = document.createElement("strong");
        strong.textContent = String(value).toUpperCase();
        return strong;
      }
      if (column.key === "city") return "<em>unsafe</em>";
      return String(value);
    };
    expect(table.querySelector("tbody strong")?.textContent).toBe("ADA");
    expect(table.querySelector("tbody em")).toBeNull();
    expect(table.querySelector("tbody tr td:last-child")?.textContent).toBe("<em>unsafe</em>");
  });

  it("supports the structural selection column without owning selection state", () => {
    const table = mount("selection-column");
    table.isRowSelected = (row) => row.id === 2;
    table.renderSelectionHeader = () => "Selection";
    table.renderSelectionCell = ({ rowId }) => String(rowId);
    expect(within(table).getAllByRole("columnheader")[0]).toHaveTextContent("Selection");
    expect(table.querySelectorAll("tbody tr[data-selected]")).toHaveLength(1);
    expect(
      (table.querySelector("tbody tr[data-selected]") as HTMLElement | null)?.dataset.rowId,
    ).toBe("2");
  });

  it("renders and removes a text empty state inside the table", () => {
    const table = mount();
    table.setAttribute("empty-text", "Choose a table from the catalog");
    table.rows = [];

    const empty = within(table).getByRole("cell", {
      name: "Choose a table from the catalog",
    });
    expect(empty).toHaveAttribute("colspan", "3");
    expect(empty.closest("tbody")).toBe(table.querySelector("tbody"));

    table.rows = rows;
    expect(within(table).queryByText("Choose a table from the catalog")).toBeNull();
  });

  it("renders rich empty content as DOM and spans a selection column", () => {
    const table = mount("selection-column");
    const message = document.createElement("strong");
    message.textContent = "No results";
    table.renderEmpty = () => message;
    table.rows = [];

    expect(within(table).getByText("No results").tagName).toBe("STRONG");
    expect(within(table).getByRole("cell")).toHaveAttribute("colspan", "4");
  });

  it("inserts string empty content as text rather than markup", () => {
    const table = mount();
    table.renderEmpty = () => "<button>unsafe</button>";
    table.rows = [];

    expect(table.querySelector("tbody button")).toBeNull();
    expect(within(table).getByRole("cell")).toHaveTextContent("<button>unsafe</button>");
  });

  it("has no accessibility violations with data or an empty state", async () => {
    const table = mount();
    expect(await axe(document.body)).toHaveNoViolations();
    table.setAttribute("empty-text", "Choose a table from the catalog");
    table.rows = [];
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
