import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { nextTick } from "vue";
import { TableSet } from "./TableSet";
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

const setup = (props: Record<string, unknown> = {}) =>
  render(TableSet, { props: { columns, rows: people, caption: "People", ...props } });

const bodyNames = () =>
  Array.from(document.querySelectorAll("tbody tr td:first-child")).map((c) => c.textContent);

describe("Vue TableSet — filtering coordination", () => {
  describe("distinguished states", () => {
    it("keeps a plain empty dataset as an empty table, never no-results", () => {
      setup({ rows: [], filtersActive: true, totalRowCount: 0 });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows no-results when filters are active and rows are gone", () => {
      setup({ rows: [], filtersActive: true, totalRowCount: 5, onClearFilters: vi.fn() });
      const panel = screen.getByRole("status");
      expect(panel).toHaveTextContent("No rows match the current filters");
      expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("treats an unknown total as not empty", () => {
      setup({ rows: [], filtersActive: true });
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("offers no clear action without onClearFilters and honours custom copy", () => {
      setup({ rows: [], filtersActive: true, noResultsLabel: "Nobody here" });
      expect(screen.getByRole("status")).toHaveTextContent("Nobody here");
      expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });

    it("renders content normally while filters are active and rows exist", () => {
      setup({ filtersActive: true, totalRowCount: 9 });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows zero rows without active filters as an empty table", () => {
      setup({ rows: [], totalRowCount: 5 });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("page reset", () => {
    it("emits nothing on mount, whatever the initial signals", () => {
      const onPageChange = vi.fn();
      setup({ pageSize: 2, page: 2, filtersActive: true, filterRevision: "r1", onPageChange });
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("resets to page one exactly once when the revision changes", async () => {
      const onPageChange = vi.fn();
      const { rerender } = setup({ pageSize: 2, page: 2, filterRevision: "r1", onPageChange });
      await rerender({ filterRevision: "r2" });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      await rerender({ filterRevision: "r2" });
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it("stays silent when already on page one", async () => {
      const onPageChange = vi.fn();
      const { rerender } = setup({ pageSize: 2, filterRevision: 1, onPageChange });
      await rerender({ filterRevision: 2 });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("resets when the active-filter signal toggles in either direction", async () => {
      const onPageChange = vi.fn();
      const { rerender } = setup({ pageSize: 2, page: 2, filtersActive: false, onPageChange });
      await rerender({ filtersActive: true });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      await rerender({ page: 3 });
      expect(bodyNames()).toEqual(["Grace"]);
      await rerender({ filtersActive: false });
      expect(onPageChange).toHaveBeenCalledTimes(2);
      expect(onPageChange).toHaveBeenLastCalledWith(1);
    });

    it("never resets on a new rows-array identity alone", async () => {
      const onPageChange = vi.fn();
      const { rerender } = setup({ pageSize: 2, page: 2, filtersActive: true, onPageChange });
      await rerender({ rows: people.map((row) => ({ ...row })) });
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("wins over a page prop in the same update; a later page prop overwrites", async () => {
      const onPageChange = vi.fn();
      const { rerender } = setup({ pageSize: 2, page: 2, filterRevision: "a", onPageChange });
      await rerender({ page: 3, filterRevision: "b" });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      await rerender({ page: 2 });
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("selection preservation", () => {
    it("keeps the selection across a reset and a filter round-trip", async () => {
      const onSelectedRowIdsChange = vi.fn();
      const { rerender } = setup({
        pageSize: 2,
        page: 2,
        selectionMode: "multiple",
        selectedRowIds: [1, 5],
        getRowLabel: (row: TableRow) => String(row.name),
        filtersActive: false,
        filterRevision: "a",
        onSelectedRowIdsChange,
      });
      await rerender({ filtersActive: true, filterRevision: "b", rows: [] });
      expect(screen.getByRole("status")).toBeInTheDocument();
      await rerender({ filtersActive: false, rows: [people[0]!, people[4]!] });
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
      const { rerender } = setup({ rows: [], filtersActive: true, onClearFilters: vi.fn() });
      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      await rerender({ filtersActive: false, rows: [people[0]!] });
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(document.activeElement).toBe(document.querySelector(".table-view"));
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
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("adds no live region around the table and passes axe", async () => {
    const { container } = setup({ filtersActive: true, totalRowCount: 9 });
    expect(container.querySelector("[aria-live]")).toBeNull();
    expect(
      await axe(container, { rules: { "color-contrast": { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
