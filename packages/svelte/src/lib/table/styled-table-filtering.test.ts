import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./table-selection.fixture.svelte";

// The fixture's five people rows; filtering happens outside the component,
// so the tests hand in already-filtered rows.
const people = [
  { id: 1, name: "Ada", age: 36, city: "London" },
  { id: 2, name: "Grace", age: 85, city: "New York" },
  { id: 3, name: "alan", age: 41, city: "London" },
  { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
  { id: 5, name: "Barbara", age: 80, city: "Boston" },
];
// The no-results panel is a status of its own; the view's results region is
// the other one, so the panel is found by where it sits.
const noResultsPanel = () => document.querySelector(".table-view__no-results [role='status']");
const announcer = () => document.querySelector(".table-view > .table-view__sr[role='status']");

const bodyNames = () =>
  Array.from(document.querySelectorAll("tbody tr td:nth-child(2)")).map((c) => c.textContent);

describe("Svelte TableSet — filtering coordination", () => {
  describe("distinguished states", () => {
    it("keeps a plain empty dataset as an empty table, never no-results", () => {
      render(Fixture, { props: { rows: [], filtersActive: true, totalRowCount: 0 } });
      expect(noResultsPanel()).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows no-results when filters are active and rows are gone", () => {
      render(Fixture, {
        props: { rows: [], filtersActive: true, totalRowCount: 5, onClearFilters: vi.fn() },
      });
      const panel = noResultsPanel();
      expect(panel).toHaveTextContent("No rows match the current filters");
      expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("treats an unknown total as not empty", () => {
      render(Fixture, { props: { rows: [], filtersActive: true } });
      expect(noResultsPanel()).toBeInTheDocument();
    });

    it("offers no clear action without onClearFilters and honours custom copy", () => {
      render(Fixture, {
        props: { rows: [], filtersActive: true, noResultsLabel: "Nobody here" },
      });
      expect(noResultsPanel()).toHaveTextContent("Nobody here");
      expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });

    it("renders content normally while filters are active and rows exist", () => {
      render(Fixture, { props: { filtersActive: true, totalRowCount: 9 } });
      expect(noResultsPanel()).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows zero rows without active filters as an empty table", () => {
      render(Fixture, { props: { rows: [], totalRowCount: 5 } });
      expect(noResultsPanel()).not.toBeInTheDocument();
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
      await rerender({ loading: true });
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
      expect(noResultsPanel()).toBeInTheDocument();
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
    expect(noResultsPanel()).toBeInTheDocument();
  });

  describe("results announcement", () => {
    it("announces the result count when filtering changes it, never on first render", async () => {
      const { rerender } = render(Fixture, { props: { totalRowCount: 5 } });
      expect(announcer()).toHaveAttribute("aria-live", "polite");
      expect(announcer()?.textContent).toBe("");

      await rerender({ filtersActive: true, rows: people.slice(0, 2) });
      expect(announcer()).toHaveTextContent("2 results");
      await rerender({ rows: people.slice(0, 1) });
      expect(announcer()).toHaveTextContent("1 result");

      const region = announcer();
      await rerender({ rows: [] });
      // The panel announces the no-results state, so the region does not.
      expect(announcer()).toBe(region);
      expect(announcer()?.textContent).toBe("");
      expect(noResultsPanel()).toHaveTextContent("No rows match the current filters");
    });

    it("announces a cleared filter and stays silent on other re-renders", async () => {
      const { rerender } = render(Fixture, { props: { filtersActive: true, rows: [] } });
      expect(announcer()?.textContent).toBe("");
      await rerender({ filtersActive: false, rows: people.slice(0, 3) });
      expect(announcer()).toHaveTextContent("3 results");
      await rerender({ rows: people.slice(0, 2) });
      expect(announcer()).toHaveTextContent("3 results");
    });

    it("stays silent for rows that arrive with no filtering behind them", async () => {
      const { rerender } = render(Fixture, { props: { rows: people.slice(0, 2) } });
      await rerender({ rows: people });
      expect(announcer()?.textContent).toBe("");
    });
  });

  it("keeps the table outside the live region and passes axe", async () => {
    const { container } = render(Fixture, { props: { filtersActive: true, totalRowCount: 9 } });
    const live = container.querySelectorAll("[aria-live]");
    expect(live).toHaveLength(1);
    expect(live[0]?.textContent).toBe("");
    expect(live[0]).not.toContainElement(screen.getByRole("table"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
