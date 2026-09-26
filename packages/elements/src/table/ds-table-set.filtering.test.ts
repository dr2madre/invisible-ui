import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsTableSet } from "./ds-table-set";
import { bodyNames as names, listen, mountSet, type MountOptions } from "./table-set.fixture";

afterEach(() => {
  document.body.innerHTML = "";
});

// Filtering happens outside the element, so the tests hand in filtered rows.
// The selection column comes first, so names sit in the second column.
const bodyNames = () => names(2);

const mount = ({ attrs = {}, props = {} }: MountOptions = {}) =>
  mountSet({
    attrs: { "selection-mode": "multiple", ...attrs },
    props: { getRowLabel: (row) => String(row.name), ...props },
  });

describe("<ds-table-set> filtering coordination", () => {
  describe("distinguished states", () => {
    it("keeps a plain empty dataset as an empty table, never no-results", () => {
      mount({ attrs: { "filters-active": true, "total-row-count": 0 }, props: { rows: [] } });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows no-results when filters are active and rows are gone", () => {
      mount({
        attrs: { "filters-active": true, "total-row-count": 5, "filters-clearable": true },
        props: { rows: [] },
      });
      expect(screen.getByRole("status")).toHaveTextContent("No rows match the current filters");
      expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("treats an unknown total as not empty", () => {
      mount({ attrs: { "filters-active": true }, props: { rows: [] } });
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("offers no clear action unless clearable and honours custom copy", () => {
      mount({
        attrs: { "filters-active": true, "no-results-label": "Nobody here" },
        props: { rows: [] },
      });
      expect(screen.getByRole("status")).toHaveTextContent("Nobody here");
      expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });

    it("renders content normally while filters are active and rows exist", () => {
      mount({ attrs: { "filters-active": true, "total-row-count": 9 } });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    });

    it("shows zero rows without active filters as an empty table", () => {
      mount({ attrs: { "total-row-count": 5 }, props: { rows: [] } });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("page reset", () => {
    it("emits nothing on mount, whatever the initial signals", () => {
      const set = document.createElement("ds-table-set") as DsTableSet;
      const onPageChange = listen(set, "page-change");
      set.setAttribute("page-size", "2");
      set.setAttribute("page", "2");
      set.setAttribute("filters-active", "");
      set.setAttribute("filter-revision", "r1");
      set.columns = [{ key: "name", header: "Name", sortable: true }];
      set.rows = [{ name: "Ada" }, { name: "alan" }, { name: "Barbara" }, { name: "Edsger" }];
      document.body.appendChild(set);
      expect(onPageChange).not.toHaveBeenCalled();
      expect(names()).toEqual(["Barbara", "Edsger"]);
    });

    it("resets to page one exactly once when the revision changes", () => {
      const set = mount({ attrs: { "page-size": 2, page: 2, "filter-revision": "r1" } });
      const onPageChange = listen(set, "page-change");
      set.setAttribute("filter-revision", "r2");
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith({ page: 1 });
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      set.setAttribute("filter-revision", "r2");
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it("stays silent when already on page one", () => {
      const set = mount({ attrs: { "page-size": 2, "filter-revision": 1 } });
      const onPageChange = listen(set, "page-change");
      set.setAttribute("filter-revision", "2");
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("resets when the active-filter signal toggles in either direction", () => {
      const set = mount({ attrs: { "page-size": 2, page: 2 } });
      const onPageChange = listen(set, "page-change");
      set.setAttribute("filters-active", "");
      expect(onPageChange).toHaveBeenCalledTimes(1);
      set.setAttribute("page", "3");
      expect(bodyNames()).toEqual(["Grace"]);
      set.removeAttribute("filters-active");
      expect(onPageChange).toHaveBeenCalledTimes(2);
      expect(onPageChange).toHaveBeenLastCalledWith({ page: 1 });
    });

    it("treats an unchanged NaN revision as unchanged", () => {
      const set = mount({ attrs: { "page-size": 2, page: 2, "filter-revision": NaN } });
      const onPageChange = listen(set, "page-change");
      set.setAttribute("filter-revision", String(NaN));
      set.setAttribute("loading", "");
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("never resets on a new rows array alone", () => {
      const set = mount({ attrs: { "page-size": 2, page: 2, "filters-active": true } });
      const onPageChange = listen(set, "page-change");
      set.rows = set.rows.slice();
      expect(onPageChange).not.toHaveBeenCalled();
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });

    it("wins over a page change applied just before; a later page overwrites", () => {
      const set = mount({ attrs: { "page-size": 2, page: 2, "filter-revision": "a" } });
      const onPageChange = listen(set, "page-change");
      set.setAttribute("page", "3");
      set.setAttribute("filter-revision", "b");
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith({ page: 1 });
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      set.setAttribute("page", "2");
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("selection preservation", () => {
    it("keeps the selection across a reset and a filter round-trip", () => {
      const set = mount({
        attrs: { "page-size": 2, page: 2, "filter-revision": "a" },
        props: { selectedRowIds: [1, 5] },
      });
      const onSelected = listen(set, "selected-row-ids-change");
      set.setAttribute("filters-active", "");
      set.setAttribute("filter-revision", "b");
      set.rows = [];
      expect(screen.getByRole("status")).toBeInTheDocument();
      set.removeAttribute("filters-active");
      set.rows = [
        { id: 1, name: "Ada", age: 36, city: "London" },
        { id: 5, name: "Barbara", age: 80, city: "Boston" },
      ];
      expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Select Barbara" })).toBeChecked();
      expect(onSelected).not.toHaveBeenCalled();
    });
  });

  describe("clear action", () => {
    it("emits clear-filters exactly once per activation, and keeps it inside", async () => {
      const user = userEvent.setup();
      const set = mount({
        attrs: { "filters-active": true, "filters-clearable": true },
        props: { rows: [] },
      });
      const onClear = listen(set, "clear-filters");
      const onAction = listen(set, "action");
      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onAction).not.toHaveBeenCalled();
    });

    it("moves focus to the view root when content returns after clearing", async () => {
      const user = userEvent.setup();
      const set = mount({
        attrs: { "filters-active": true, "filters-clearable": true },
        props: { rows: [] },
      });
      await user.click(screen.getByRole("button", { name: "Clear filters" }));
      set.removeAttribute("filters-active");
      set.rows = [{ id: 1, name: "Ada", age: 36, city: "London" }];
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(document.activeElement).toBe(document.querySelector(".table-view"));
    });
  });

  it("forwards the coordination inputs into tabbed views", () => {
    mount({
      attrs: { "filters-active": true, "total-row-count": 5 },
      props: {
        views: [
          { id: "people", label: "People", columns: [{ key: "name", header: "Name" }], rows: [] },
        ],
      },
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("adds no live region around the table and passes axe", async () => {
    mount({ attrs: { "filters-active": true, "total-row-count": 9 } });
    expect(document.body.querySelector("[aria-live]")).toBeNull();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("passes axe in the no-results state", async () => {
    mount({ attrs: { "filters-active": true, "filters-clearable": true }, props: { rows: [] } });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
