import { render, screen, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Table, type TableColumnDef, type TableRow } from "./Table";

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

const bodyNames = () =>
  Array.from(document.querySelectorAll("tbody tr td:first-child")).map((c) => c.textContent);

describe("Vue Table (pure grid)", () => {
  it("renders a captioned table with column headers and the rows it is given", () => {
    render(Table, { props: { columns, rows, caption: "People" } });
    expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Name/ })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 rows
    expect(bodyNames()).toEqual(["Ada", "Grace", "alan"]); // exactly as passed (controlled)
  });

  it("reflects the controlled sort on the headers and leaves non-sortable ones bare", () => {
    render(Table, {
      props: { columns, rows, caption: "People", sort: { key: "name", direction: "asc" } },
    });
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByRole("columnheader", { name: /Age/ })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: "City" })).not.toHaveAttribute("aria-sort");
  });

  it("calls onSortToggle with the column key when a sortable header is activated", async () => {
    const user = userEvent.setup();
    const onSortToggle = vi.fn();
    render(Table, { props: { columns, rows, caption: "People", onSortToggle } });
    await user.click(
      within(screen.getByRole("columnheader", { name: /Name/ })).getByRole("button"),
    );
    expect(onSortToggle).toHaveBeenCalledWith("name");
  });

  it("renders custom cell content via the scoped cell slot", () => {
    render(Table, {
      props: { columns, rows, caption: "People" },
      slots: {
        cell: ({ column, value }: { column: TableColumnDef; value: unknown }) =>
          column.key === "name" ? String(value).toUpperCase() : String(value),
      },
    });
    expect(bodyNames()).toEqual(["ADA", "GRACE", "ALAN"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Table, {
      props: { columns, rows, caption: "People", sort: { key: "name", direction: "asc" } },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
