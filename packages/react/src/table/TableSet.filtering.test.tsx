import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { TableSet, type TableSetProps } from "./TableSet";
import type { TableColumnDef, TableRow } from "./Table";

const columns: TableColumnDef[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", align: "end" },
  { key: "city", header: "City" },
];

const people: TableRow[] = [
  { id: 1, name: "Ada", age: 36, city: "London" },
  { id: 2, name: "Grace", age: 85, city: "New York" },
  { id: 3, name: "alan", age: 41, city: "London" },
  { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
  { id: 5, name: "Barbara", age: 80, city: "Boston" },
];

// `update` merges the next props into the current ones: a prop change on the
// same element, never a remount.
const setup = (props: Partial<TableSetProps> = {}) => {
  let current: TableSetProps = { columns, rows: people, caption: "People", ...props };
  const utils = render(<TableSet {...current} />);
  const update = (next: Partial<TableSetProps>) => {
    current = { ...current, ...next };
    utils.rerender(<TableSet {...current} />);
  };
  return { ...utils, update };
};

// The no-results panel is a status of its own; the view's results region is
// the other one, so the panel is found by where it sits.
const noResultsPanel = () => document.querySelector(".table-view__no-results [role='status']");
const announcer = () => document.querySelector(".table-view > .table-view__sr[role='status']");

const bodyNames = () =>
  Array.from(document.querySelectorAll("tbody tr td:first-child")).map((c) => c.textContent);

describe("React TableSet: filtering coordination", () => {
  describe("distinguished states", () => {
    it("keeps a plain empty dataset as an empty table, never no-results", () => {
      setup({ rows: [], filtersActive: true, totalRowCount: 0 });
      expect(noResultsPanel()).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows no-results when filters are active and rows are gone", () => {
      setup({ rows: [], filtersActive: true, totalRowCount: 5, onClearFilters: vi.fn() });
      const panel = noResultsPanel();
      expect(panel).toHaveTextContent("No rows match the current filters");
      expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("treats an unknown total as not empty", () => {
      setup({ rows: [], filtersActive: true });
      expect(noResultsPanel()).toBeInTheDocument();
    });

    it("offers no clear action without onClearFilters and honours custom copy", () => {
      setup({ rows: [], filtersActive: true, noResultsLabel: "Nobody here" });
      expect(noResultsPanel()).toHaveTextContent("Nobody here");
      expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });

    it("renders content normally while filters are active and rows exist", () => {
      setup({ filtersActive: true, totalRowCount: 9 });
      expect(noResultsPanel()).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows zero rows without active filters as an empty table", () => {
      setup({ rows: [], totalRowCount: 5 });
      expect(noResultsPanel()).not.toBeInTheDocument();
    });
  });

  describe("page reset", () => {
    it("emits nothing on mount, whatever the initial signals", () => {
      const onPageChange = vi.fn();
      setup({ pageSize: 2, page: 2, filtersActive: true, filterRevision: "r1", onPageChange });
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("resets to page one exactly once when the revision changes", () => {
      const onPageChange = vi.fn();
      const { update } = setup({ pageSize: 2, page: 2, filterRevision: "r1", onPageChange });
      update({ filterRevision: "r2" });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      update({ filterRevision: "r2" });
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it("stays silent when already on page one", () => {
      const onPageChange = vi.fn();
      const { update } = setup({ pageSize: 2, filterRevision: 1, onPageChange });
      update({ filterRevision: 2 });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("resets when the active-filter signal toggles in either direction", () => {
      const onPageChange = vi.fn();
      const { update } = setup({ pageSize: 2, page: 2, filtersActive: false, onPageChange });
      update({ filtersActive: true });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      update({ page: 3 });
      expect(bodyNames()).toEqual(["Grace"]);
      update({ filtersActive: false });
      expect(onPageChange).toHaveBeenCalledTimes(2);
      expect(onPageChange).toHaveBeenLastCalledWith(1);
    });

    it("treats an unchanged NaN revision as unchanged", () => {
      const onPageChange = vi.fn();
      const { update } = setup({ pageSize: 2, page: 2, filterRevision: NaN, onPageChange });
      // An unrelated rerender with the same NaN revision must not reset.
      update({ loading: false });
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("never resets on a new rows-array identity alone", () => {
      const onPageChange = vi.fn();
      const { update } = setup({ pageSize: 2, page: 2, filtersActive: true, onPageChange });
      update({ rows: people.map((row) => ({ ...row })) });
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("wins over a page prop in the same update; a later page prop overwrites", () => {
      const onPageChange = vi.fn();
      const { update } = setup({ pageSize: 2, page: 2, filterRevision: "a", onPageChange });
      update({ page: 3, filterRevision: "b" });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      update({ page: 2 });
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("replacement callbacks", () => {
    it("calls only the latest onPageChange and onClearFilters", async () => {
      const user = userEvent.setup();
      const firstPage = vi.fn();
      const secondPage = vi.fn();
      const firstClear = vi.fn();
      const secondClear = vi.fn();
      const { update } = setup({
        pageSize: 2,
        page: 2,
        filterRevision: "a",
        onPageChange: firstPage,
        onClearFilters: firstClear,
      });
      update({ onPageChange: secondPage, onClearFilters: secondClear });
      update({ filterRevision: "b", rows: [], filtersActive: true });
      expect(firstPage).not.toHaveBeenCalled();
      expect(secondPage).toHaveBeenCalledTimes(1);
      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(firstClear).not.toHaveBeenCalled();
      expect(secondClear).toHaveBeenCalledTimes(1);
    });
  });

  describe("selection preservation", () => {
    it("keeps the selection across a reset and a filter round-trip", () => {
      const onSelectedRowIdsChange = vi.fn();
      const { update } = setup({
        pageSize: 2,
        page: 2,
        selectionMode: "multiple",
        selectedRowIds: [1, 5],
        getRowLabel: (row: TableRow) => String(row.name),
        filtersActive: false,
        filterRevision: "a",
        onSelectedRowIdsChange,
      });
      update({ filtersActive: true, filterRevision: "b", rows: [] });
      expect(noResultsPanel()).toBeInTheDocument();
      update({ filtersActive: false, rows: [people[0]!, people[4]!] });
      expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Select Barbara" })).toBeChecked();
      expect(onSelectedRowIdsChange).not.toHaveBeenCalled();
    });
  });

  describe("clear action", () => {
    it("calls onClearFilters exactly once per activation", async () => {
      const user = userEvent.setup();
      const onClearFilters = vi.fn();
      setup({ rows: [], filtersActive: true, onClearFilters });
      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });

    it("moves focus to the view root when content returns after clearing", async () => {
      const user = userEvent.setup();
      const { update } = setup({ rows: [], filtersActive: true, onClearFilters: vi.fn() });
      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      update({ filtersActive: false, rows: [people[0]!] });
      await waitFor(() =>
        expect(document.activeElement).toBe(document.querySelector(".table-view")),
      );
    });
  });

  it("forwards the coordination inputs into tabbed views", () => {
    setup({
      views: [
        { id: "people", label: "People", columns: [{ key: "name", header: "Name" }], rows: [] },
      ],
      filtersActive: true,
      totalRowCount: 5,
    });
    expect(noResultsPanel()).toBeInTheDocument();
  });

  describe("results announcement", () => {
    it("announces the result count when filtering changes it, never on first render", () => {
      const { update } = setup({ totalRowCount: 5 });
      expect(announcer()).toHaveAttribute("aria-live", "polite");
      expect(announcer()).toBeEmptyDOMElement();

      update({ filtersActive: true, rows: people.slice(0, 2) });
      expect(announcer()).toHaveTextContent("2 results");
      update({ rows: people.slice(0, 1) });
      expect(announcer()).toHaveTextContent("1 result");

      const region = announcer();
      update({ rows: [] });
      // The panel announces the no-results state, so the region does not.
      expect(announcer()).toBe(region);
      expect(announcer()).toBeEmptyDOMElement();
      expect(noResultsPanel()).toHaveTextContent("No rows match the current filters");
    });

    it("announces a cleared filter and stays silent on other re-renders", () => {
      const { update } = setup({ filtersActive: true, rows: [] });
      expect(announcer()).toBeEmptyDOMElement();
      update({ filtersActive: false, rows: people.slice(0, 3) });
      expect(announcer()).toHaveTextContent("3 results");
      update({ rows: people.slice(0, 2) });
      expect(announcer()).toHaveTextContent("3 results");
    });

    it("stays silent for rows that arrive with no filtering behind them", () => {
      const { update } = setup({ rows: people.slice(0, 2) });
      update({ rows: people });
      expect(announcer()).toBeEmptyDOMElement();
    });
  });

  it("keeps the table outside the live region and passes axe", async () => {
    const { container } = setup({ filtersActive: true, totalRowCount: 9 });
    const live = container.querySelectorAll("[aria-live]");
    expect(live).toHaveLength(1);
    expect(live[0]).toBeEmptyDOMElement();
    expect(live[0]).not.toContainElement(screen.getByRole("table"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
