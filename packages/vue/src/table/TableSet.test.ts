import { render, screen, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { TableSet, type TableViewDef } from "./TableSet";
import type { TableColumnDef, TableRow } from "./Table";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const columns: TableColumnDef[] = [
  { key: "name", header: "Name", sortable: true, hideable: false },
  { key: "age", header: "Age", sortable: true, align: "end" },
  { key: "city", header: "City" },
];

const rows: TableRow[] = [
  { id: 1, name: "Ada", age: 36, city: "London" },
  { id: 2, name: "Grace", age: 85, city: "New York" },
  { id: 3, name: "alan", age: 41, city: "London" },
  { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
  { id: 5, name: "Barbara", age: 80, city: "Boston" },
];

const setup = (props: Record<string, unknown> = {}) =>
  render(TableSet, { props: { columns, rows, title: "People", caption: "People", ...props } });

const bodyNames = () =>
  Array.from(document.querySelectorAll("tbody tr td:first-child")).map((cell) => cell.textContent);

describe("Vue TableSet", () => {
  it("renders a titled set with the table inside, sorted by default", () => {
    setup();
    expect(screen.getByRole("heading", { name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    // There is always an active sort: the first sortable column (name), ascending.
    expect(bodyNames()).toEqual(["Ada", "alan", "Barbara", "Edsger", "Grace"]);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("toggles a sortable header between ascending and descending, never unsorted", async () => {
    const user = userEvent.setup();
    setup();
    const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole(
      "button",
    );
    // Default is ascending; the first click flips to descending.
    await user.click(nameButton);
    expect(bodyNames()).toEqual(["Grace", "Edsger", "Barbara", "alan", "Ada"]);
    // The second click returns to ascending; it never cycles to "no sort".
    await user.click(nameButton);
    expect(bodyNames()).toEqual(["Ada", "alan", "Barbara", "Edsger", "Grace"]);
  });

  describe("pagination", () => {
    it("pages the sorted rows and shows a pager", () => {
      setup({ pageSize: 2 });
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      expect(screen.getByRole("navigation", { name: "Table pages" })).toBeInTheDocument();
    });

    it("navigates to the next page", async () => {
      const user = userEvent.setup();
      setup({ pageSize: 2 });
      await user.click(screen.getByRole("button", { name: "Go to page 2" }));
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });
  });

  describe("column visibility config", () => {
    it("hides a column when its checkbox is toggled off in the dropdown", async () => {
      const user = userEvent.setup();
      setup({ configurable: true });
      expect(screen.getByRole("columnheader", { name: "City" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Columns" }));
      const cityToggle = screen.getByRole("checkbox", { name: "City" });
      expect(cityToggle).toBeChecked();
      await user.click(cityToggle);
      expect(screen.queryByRole("columnheader", { name: "City" })).not.toBeInTheDocument();
    });

    it("keeps non-hideable columns even if their toggle is clicked", async () => {
      const user = userEvent.setup();
      setup({ configurable: true });
      await user.click(screen.getByRole("button", { name: "Columns" }));
      await user.click(screen.getByRole("checkbox", { name: "Name" }));
      expect(screen.getByRole("columnheader", { name: /Name/ })).toBeInTheDocument();
    });
  });

  describe("view switching", () => {
    it("renders cards in card view", () => {
      setup({ view: "card" });
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(5);
    });

    it("switches from table to cards via the segmented control", async () => {
      const user = userEvent.setup();
      setup({ allowViewToggle: true });
      expect(screen.getByRole("table")).toBeInTheDocument();
      await user.click(screen.getByRole("radio", { name: "Cards" }));
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
    });
  });

  describe("infinite scroll", () => {
    it("renders all rows (no pager) and a load-more button when there is more", () => {
      setup({ infinite: true, hasMore: true });
      expect(bodyNames()).toHaveLength(5); // every row, not a page
      expect(screen.queryByRole("navigation", { name: "Table pages" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
    });

    it("calls onLoadMore when the load-more button is clicked", async () => {
      const user = userEvent.setup();
      const onLoadMore = vi.fn();
      setup({ infinite: true, hasMore: true, onLoadMore });
      await user.click(screen.getByRole("button", { name: "Load more" }));
      expect(onLoadMore).toHaveBeenCalledOnce();
    });

    it("disables the button and shows a status while loading", () => {
      setup({ infinite: true, hasMore: true, loading: true });
      expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
      expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    });

    it("shows no load-more button when there is nothing more", () => {
      setup({ infinite: true, hasMore: false });
      expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({ pageSize: 2, configurable: true });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

describe("Vue TableSet: tabs as distinct views", () => {
  const peopleColumns: TableColumnDef[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "city", header: "City" },
  ];
  const orderColumns: TableColumnDef[] = [
    { key: "ref", header: "Reference", sortable: true },
    { key: "total", header: "Total", sortable: true, align: "end" },
  ];

  const views: TableViewDef[] = [
    {
      id: "people",
      label: "People",
      columns: peopleColumns,
      rows: [
        { id: 1, name: "Ada", city: "London" },
        { id: 2, name: "Grace", city: "New York" },
      ],
    },
    {
      id: "orders",
      label: "Orders",
      columns: orderColumns,
      rows: [
        { id: "A1", ref: "A1", total: 120 },
        { id: "A2", ref: "A2", total: 80 },
      ],
    },
  ];

  const setupViews = () =>
    render(TableSet, { props: { views, title: "Workspace", viewsLabel: "Data views" } });

  it("renders a tablist of the views with the first one active", () => {
    setupViews();
    expect(screen.getByRole("tablist", { name: "Data views" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Orders" })).toBeInTheDocument();
    // The first view's columns are shown.
    expect(screen.getByRole("columnheader", { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("swaps the whole table (columns + rows) when another tab is selected", async () => {
    const user = userEvent.setup();
    setupViews();
    await user.click(screen.getByRole("tab", { name: "Orders" }));
    // The orders view has its own columns and rows.
    expect(screen.getByRole("columnheader", { name: /Reference/ })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Name/ })).not.toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
  });

  it("keeps each view's sort independent (state resets on switch)", async () => {
    const user = userEvent.setup();
    setupViews();
    // The default sort is name ascending; one click flips it to descending.
    const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole(
      "button",
    );
    await user.click(nameButton); // asc -> desc
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    await user.click(screen.getByRole("tab", { name: "Orders" }));
    await user.click(screen.getByRole("tab", { name: "People" }));
    // Remounted fresh: the sort is back to the default (name ascending).
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = setupViews();
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
