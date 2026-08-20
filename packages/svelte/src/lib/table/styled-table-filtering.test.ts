import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./table-selection.fixture.svelte";

// The fixture's five people rows; filtering happens outside the component,
// so the tests hand in already-filtered rows.
const bodyNames = () =>
  Array.from(document.querySelectorAll("tbody tr td:nth-child(2)")).map((c) => c.textContent);

describe("Svelte TableSet — filtering coordination", () => {
  describe("distinguished states", () => {
    it("keeps a plain empty dataset as an empty table, never no-results", () => {
      render(Fixture, { props: { rows: [], filtersActive: true, totalRowCount: 0 } });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows no-results when filters are active and rows are gone", () => {
      render(Fixture, {
        props: { rows: [], filtersActive: true, totalRowCount: 5, onClearFilters: vi.fn() },
      });
      const panel = screen.getByRole("status");
      expect(panel).toHaveTextContent("No rows match the current filters");
      expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("treats an unknown total as not empty", () => {
      render(Fixture, { props: { rows: [], filtersActive: true } });
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("offers no clear action without onClearFilters and honours custom copy", () => {
      render(Fixture, {
        props: { rows: [], filtersActive: true, noResultsLabel: "Nobody here" },
      });
      expect(screen.getByRole("status")).toHaveTextContent("Nobody here");
      expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });

    it("renders content normally while filters are active and rows exist", () => {
      render(Fixture, { props: { filtersActive: true, totalRowCount: 9 } });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows zero rows without active filters as an empty table", () => {
      render(Fixture, { props: { rows: [], totalRowCount: 5 } });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("page reset", () => {
    it("emits nothing on mount, whatever the initial signals", () => {
      const onPageChange = vi.fn();
      render(Fixture, {
        props: { pageSize: 2, page: 2, filtersActive: true, filterRevision: "r1", onPageChange },
      });
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("resets to page one exactly once when the revision changes", async () => {
      const onPageChange = vi.fn();
      const { rerender } = render(Fixture, {
        props: { pageSize: 2, page: 2, filterRevision: "r1", onPageChange },
      });
      await rerender({ filterRevision: "r2" });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      // The same revision on a later rerender does nothing.
      await rerender({ filterRevision: "r2" });
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it("stays silent when already on page one", async () => {
      const onPageChange = vi.fn();
      const { rerender } = render(Fixture, {
        props: { pageSize: 2, filterRevision: 1, onPageChange },
      });
      await rerender({ filterRevision: 2 });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("resets when the active-filter signal toggles in either direction", async () => {
      const onPageChange = vi.fn();
      const { rerender } = render(Fixture, {
        props: { pageSize: 2, page: 2, filtersActive: false, onPageChange },
      });
      await rerender({ filtersActive: true });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      await rerender({ page: 3 });
      expect(bodyNames()).toEqual(["Grace"]);
      await rerender({ filtersActive: false });
      expect(onPageChange).toHaveBeenCalledTimes(2);
      expect(onPageChange).toHaveBeenLastCalledWith(1);
    });

    it("treats an unchanged NaN revision as unchanged", async () => {
      const onPageChange = vi.fn();
      const { rerender } = render(Fixture, {
        props: { pageSize: 2, page: 2, filterRevision: NaN, onPageChange },
      });
      // An unrelated rerender with the same NaN revision must not reset.
      await rerender({ loading: false });
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("never resets on a new rows-array identity alone", async () => {
      const onPageChange = vi.fn();
      const { rerender } = render(Fixture, {
        props: { pageSize: 2, page: 2, filtersActive: true, onPageChange },
      });
      await rerender({
        rows: [
          { id: 1, name: "Ada", age: 36, city: "London" },
          { id: 2, name: "Grace", age: 85, city: "New York" },
          { id: 3, name: "alan", age: 41, city: "London" },
          { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
          { id: 5, name: "Barbara", age: 80, city: "Boston" },
        ],
      });
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("wins over a page prop in the same update; a later page prop overwrites", async () => {
      const onPageChange = vi.fn();
      const { rerender } = render(Fixture, {
        props: { pageSize: 2, page: 2, filterRevision: "a", onPageChange },
      });
      await rerender({ page: 3, filterRevision: "b" });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      // The next distinct page prop still overwrites the mirror silently.
      await rerender({ page: 2 });
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("replacement callbacks", () => {
    it("calls only the latest onPageChange and onClearFilters", async () => {
      const firstPage = vi.fn();
      const secondPage = vi.fn();
      const firstClear = vi.fn();
      const secondClear = vi.fn();
      const { rerender } = render(Fixture, {
        props: {
          pageSize: 2,
          page: 2,
          filterRevision: "a",
          onPageChange: firstPage,
          onClearFilters: firstClear,
        },
      });
      await rerender({ onPageChange: secondPage, onClearFilters: secondClear });
      await rerender({ filterRevision: "b", rows: [], filtersActive: true });
      expect(firstPage).not.toHaveBeenCalled();
      expect(secondPage).toHaveBeenCalledTimes(1);
      await fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(firstClear).not.toHaveBeenCalled();
      expect(secondClear).toHaveBeenCalledTimes(1);
    });
  });

  describe("selection preservation", () => {
    it("keeps the selection across a reset and a filter round-trip", async () => {
      const onSelectedRowIdsChange = vi.fn();
      const { rerender } = render(Fixture, {
        props: {
          pageSize: 2,
          page: 2,
          selectedRowIds: [1, 5],
          filtersActive: false,
          filterRevision: "a",
          onSelectedRowIdsChange,
        },
      });
      await rerender({ filtersActive: true, filterRevision: "b", rows: [] });
      expect(screen.getByRole("status")).toBeInTheDocument();
      await rerender({
        filtersActive: false,
        rows: [
          { id: 1, name: "Ada", age: 36, city: "London" },
          { id: 5, name: "Barbara", age: 80, city: "Boston" },
        ],
      });
      expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Select Barbara" })).toBeChecked();
      expect(onSelectedRowIdsChange).not.toHaveBeenCalled();
    });
  });

  describe("clear action", () => {
    it("calls onClearFilters exactly once per activation", async () => {
      const onClearFilters = vi.fn();
      render(Fixture, { props: { rows: [], filtersActive: true, onClearFilters } });
      await fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });

    it("moves focus to the view root when content returns after clearing", async () => {
      const { rerender } = render(Fixture, {
        props: { rows: [], filtersActive: true, onClearFilters: vi.fn() },
      });
      await fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
      await rerender({
        filtersActive: false,
        rows: [{ id: 1, name: "Ada", age: 36, city: "London" }],
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(document.activeElement).toBe(document.querySelector(".table-view"));
    });
  });

  it("forwards the coordination inputs into tabbed views", () => {
    render(Fixture, {
      props: {
        views: [
          {
            id: "people",
            label: "People",
            columns: [{ key: "name", header: "Name" }],
            rows: [],
          },
        ],
        filtersActive: true,
        totalRowCount: 5,
      },
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("adds no live region around the table and passes axe", async () => {
    const { container } = render(Fixture, { props: { filtersActive: true, totalRowCount: 9 } });
    expect(container.querySelector("[aria-live]")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
