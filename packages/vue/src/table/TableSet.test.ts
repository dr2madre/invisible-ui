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

// Task 5A: the controllable-mirror contract, mirroring the Svelte suite. A
// later prop change updates the rendered set without a remount; reflecting a
// prop never calls a callback; a user action calls its callback exactly once.
// These tests fail if the read-once initialization is reinstated.
describe("Vue TableSet (controlled sync)", () => {
  const header = (name: string) => screen.getByRole("columnheader", { name });
  const spies = () => ({
    onPageChange: vi.fn(),
    onSortChange: vi.fn(),
    onHiddenColumnsChange: vi.fn(),
  });
  const base = { columns, rows, title: "People", caption: "People" };

  it("follows a later sort prop without a callback", async () => {
    const callbacks = spies();
    const { rerender } = setup({ sort: { key: "name", direction: "asc" }, ...callbacks });
    expect(header("Name")).toHaveAttribute("aria-sort", "ascending");

    await rerender({ ...base, sort: { key: "age", direction: "desc" }, ...callbacks });
    expect(header("Age")).toHaveAttribute("aria-sort", "descending");
    expect(callbacks.onSortChange).not.toHaveBeenCalled();
  });

  it("follows a later hiddenColumns prop without a callback", async () => {
    const callbacks = spies();
    const { rerender } = setup({ configurable: true, ...callbacks });
    expect(screen.queryByRole("columnheader", { name: "City" })).not.toBeNull();

    await rerender({ ...base, configurable: true, hiddenColumns: ["city"], ...callbacks });
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull();
    expect(callbacks.onHiddenColumnsChange).not.toHaveBeenCalled();

    await rerender({ ...base, configurable: true, hiddenColumns: [], ...callbacks });
    expect(screen.queryByRole("columnheader", { name: "City" })).not.toBeNull();
  });

  it("keeps a hidden key that is temporarily absent from the columns", async () => {
    const callbacks = spies();
    const withoutCity: TableColumnDef[] = [
      { key: "name", header: "Name", sortable: true, hideable: false },
      { key: "age", header: "Age", sortable: true },
    ];
    const { rerender } = setup({ configurable: true, hiddenColumns: ["city"], ...callbacks });

    await rerender({
      ...base,
      configurable: true,
      hiddenColumns: ["city"],
      columns: withoutCity,
      ...callbacks,
    });
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull();

    const withCity: TableColumnDef[] = [...withoutCity, { key: "city", header: "City" }];
    await rerender({
      ...base,
      configurable: true,
      hiddenColumns: ["city"],
      columns: withCity,
      ...callbacks,
    });
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull();
    expect(callbacks.onHiddenColumnsChange).not.toHaveBeenCalled();
  });

  it("keeps the current sort when new columns still carry it, else falls back", async () => {
    const callbacks = spies();
    const { rerender } = setup({ sort: { key: "age", direction: "desc" }, ...callbacks });
    expect(header("Age")).toHaveAttribute("aria-sort", "descending");

    const reordered: TableColumnDef[] = [
      { key: "age", header: "Age", sortable: true },
      { key: "name", header: "Name", sortable: true, hideable: false },
    ];
    await rerender({
      ...base,
      sort: { key: "age", direction: "desc" },
      columns: reordered,
      ...callbacks,
    });
    expect(header("Age")).toHaveAttribute("aria-sort", "descending");

    const withoutAge: TableColumnDef[] = [
      { key: "name", header: "Name", sortable: true, hideable: false },
      { key: "city", header: "City", sortable: true },
    ];
    await rerender({
      ...base,
      sort: { key: "age", direction: "desc" },
      columns: withoutAge,
      ...callbacks,
    });
    expect(header("Name")).toHaveAttribute("aria-sort", "ascending");
    expect(callbacks.onSortChange).not.toHaveBeenCalled();
  });

  it("follows a later page prop without a callback", async () => {
    const callbacks = spies();
    const { rerender } = setup({ pageSize: 2, page: 1, ...callbacks });
    expect(screen.getByRole("table")).toHaveTextContent("Ada");

    await rerender({ ...base, pageSize: 2, page: 3, ...callbacks });
    expect(screen.getByRole("table")).toHaveTextContent("Grace");
    expect(screen.getByRole("table")).not.toHaveTextContent("Ada");
    expect(screen.getByRole("button", { name: "Go to page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(callbacks.onPageChange).not.toHaveBeenCalled();
  });

  it("follows a later table/card view prop", async () => {
    const { rerender } = setup();
    expect(screen.getByRole("table")).toBeInTheDocument();

    await rerender({ ...base, view: "card" });
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("list")).toBeInTheDocument();

    await rerender({ ...base, view: "table" });
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("clamps once when the rows shrink, reporting one page change", async () => {
    const callbacks = spies();
    const twoRows: TableRow[] = [
      { id: 1, name: "Ada", age: 36, city: "London" },
      { id: 2, name: "Grace", age: 85, city: "New York" },
    ];
    const { rerender } = setup({ pageSize: 2, page: 3, ...callbacks });
    expect(callbacks.onPageChange).not.toHaveBeenCalled();

    await rerender({ ...base, pageSize: 2, page: 3, rows: twoRows, ...callbacks });
    expect(callbacks.onPageChange).toHaveBeenCalledTimes(1);
    expect(callbacks.onPageChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole("table")).toHaveTextContent("Ada");

    await rerender({
      ...base,
      pageSize: 2,
      page: 3,
      rows: twoRows,
      caption: "People",
      ...callbacks,
    });
    expect(callbacks.onPageChange).toHaveBeenCalledTimes(1);
  });

  it("keeps a local interaction across an unrelated rerender", async () => {
    const callbacks = spies();
    const { rerender } = setup({ ...callbacks });

    await userEvent.setup().click(within(header("Age")).getByRole("button"));
    expect(header("Age")).toHaveAttribute("aria-sort", "ascending");
    expect(callbacks.onSortChange).toHaveBeenCalledTimes(1);

    await rerender({ ...base, caption: "People again", ...callbacks });
    expect(header("Age")).toHaveAttribute("aria-sort", "ascending");
    expect(callbacks.onSortChange).toHaveBeenCalledTimes(1);
  });

  it("does not remount the view when data props change", async () => {
    const { rerender } = setup();
    const marker = screen.getByRole("table");
    marker.setAttribute("data-probe", "alive");

    await rerender({
      ...base,
      rows: [{ id: 9, name: "Katherine", age: 101, city: "Hampton" }] as TableRow[],
    });
    expect(screen.getByRole("table")).toHaveAttribute("data-probe", "alive");
    expect(screen.getByRole("table")).toHaveTextContent("Katherine");
  });
});

// Task 5A: views and the active id are controllable mirrors.
describe("Vue TableSet (controlled views)", () => {
  const tab = (name: string) => screen.getByRole("tab", { name });

  const makeViews = (): TableViewDef[] => [
    {
      id: "people",
      label: "People",
      columns: [
        { key: "name", header: "Name", sortable: true },
        { key: "city", header: "City" },
      ],
      rows: [
        { id: 1, name: "Ada", city: "London" },
        { id: 2, name: "Grace", city: "New York" },
      ],
    },
    {
      id: "orders",
      label: "Orders",
      columns: [{ key: "ref", header: "Reference", sortable: true }],
      rows: [{ id: "A1", ref: "A1" }],
    },
  ];

  const setupViews = (props: Record<string, unknown> = {}) =>
    render(TableSet, { props: { views: makeViews(), title: "Workspace", ...props } });

  it("follows a later activeView prop without onViewChange", async () => {
    const onViewChange = vi.fn();
    const { rerender } = setupViews({ activeView: "people", onViewChange });
    expect(tab("People")).toHaveAttribute("aria-selected", "true");

    await rerender({
      views: makeViews(),
      title: "Workspace",
      activeView: "orders",
      onViewChange,
    });
    expect(tab("Orders")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("columnheader", { name: "Reference" })).toBeInTheDocument();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("updates label, caption, columns and rows when views are replaced", async () => {
    const { rerender } = setupViews();
    expect(tab("People")).toBeInTheDocument();

    const renamed = makeViews();
    renamed[0] = {
      ...renamed[0]!,
      label: "Humans",
      caption: "Everyone",
      columns: [{ key: "name", header: "Full name", sortable: true }],
      rows: [{ id: 3, name: "Katherine" }],
    };
    await rerender({ views: renamed, title: "Workspace" });

    expect(tab("Humans")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("columnheader", { name: "Full name" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Everyone" })).toHaveTextContent("Katherine");
  });

  it("falls back to the first remaining view when the active one is removed", async () => {
    const onViewChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = setupViews({ onViewChange });

    await user.click(tab("Orders"));
    expect(onViewChange).toHaveBeenCalledTimes(1);
    expect(tab("Orders")).toHaveAttribute("aria-selected", "true");

    await rerender({ views: makeViews().slice(0, 1), title: "Workspace", onViewChange });
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tab", { name: "Orders" })).toBeNull();
    expect(onViewChange).toHaveBeenCalledTimes(1);
  });

  it("switches between multi-view and single-view after mount", async () => {
    const { rerender } = setupViews();
    expect(screen.getAllByRole("tab")).toHaveLength(2);

    await rerender({ views: [], title: "Workspace", columns, rows });
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByRole("table")).toHaveTextContent("Ada");

    await rerender({ views: makeViews(), title: "Workspace", columns, rows });
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
  });

  it("resolves an invalid activeView at first render to the first view", () => {
    const onViewChange = vi.fn();
    setupViews({ activeView: "ghost", onViewChange });

    expect(tab("People")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("resolves a later invalid activeView to the first view, without a callback", async () => {
    const onViewChange = vi.fn();
    const { rerender } = setupViews({ activeView: "orders", onViewChange });
    expect(tab("Orders")).toHaveAttribute("aria-selected", "true");

    await rerender({ views: makeViews(), title: "Workspace", activeView: "ghost", onViewChange });
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("keeps the tabs keyboard-navigable after the views are replaced", async () => {
    const user = userEvent.setup();
    const { rerender } = setupViews();

    const replaced = [
      ...makeViews(),
      {
        id: "logs",
        label: "Logs",
        columns: [{ key: "at", header: "At" }],
        rows: [{ id: "l1", at: "now" }],
      },
    ];
    await rerender({ views: replaced, title: "Workspace" });

    tab("People").focus();
    await user.keyboard("{ArrowRight}");
    expect(tab("Orders")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tab("Logs")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(tab("Logs")).toHaveAttribute("aria-selected", "true");
  });
});
