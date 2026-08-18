import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import {
  clearSelection,
  compareValues,
  initialState,
  nextSort,
  scopeSelectionState,
  sortRows,
  toggleRowSelection,
  toggleScopeSelection,
} from "./state";
import type { TableColumn } from "./types";

const columns: TableColumn[] = [
  { key: "name", sortable: true, hideable: false },
  { key: "age", sortable: true },
  { key: "city" }, // not sortable
];

const rows = [
  { name: "Ada", age: 36, city: "London" },
  { name: "Grace", age: 85, city: "New York" },
  { name: "alan", age: 41, city: "London" },
];

const make = (overrides = {}) => initialState({ id: "x", columns, ...overrides });

describe("table state — sort cycle", () => {
  it("cycles unsorted → asc → desc → unsorted for the same column", () => {
    expect(nextSort(null, "name")).toEqual({ key: "name", direction: "asc" });
    expect(nextSort({ key: "name", direction: "asc" }, "name")).toEqual({
      key: "name",
      direction: "desc",
    });
    expect(nextSort({ key: "name", direction: "desc" }, "name")).toBeNull();
  });

  it("starts fresh ascending when switching columns", () => {
    expect(nextSort({ key: "name", direction: "desc" }, "age")).toEqual({
      key: "age",
      direction: "asc",
    });
  });
});

describe("table state — comparison & sorting", () => {
  it("compares numbers numerically and strings case-insensitively", () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues("alan", "Ada")).toBeGreaterThan(0); // case-insensitive, numeric-aware
  });

  it("sorts nullish values to the end", () => {
    expect(compareValues(null, 5)).toBeGreaterThan(0);
    expect(compareValues(5, null)).toBeLessThan(0);
  });

  it("keeps nullish values at the end when sorting descending", () => {
    const nullable = [{ value: 2 }, { value: null }, { value: 1 }];
    expect(sortRows(nullable, { key: "value", direction: "desc" })).toEqual([
      { value: 2 },
      { value: 1 },
      { value: null },
    ]);
  });

  it("sorts rows ascending and descending, stably", () => {
    const asc = sortRows(rows, { key: "age", direction: "asc" }).map((r) => r.age);
    expect(asc).toEqual([36, 41, 85]);
    const desc = sortRows(rows, { key: "age", direction: "desc" }).map((r) => r.age);
    expect(desc).toEqual([85, 41, 36]);
  });

  it("preserves order when unsorted", () => {
    expect(sortRows(rows, null)).toEqual(rows);
  });
});

describe("table connect", () => {
  const wire = (overrides = {}) => {
    const setSort = vi.fn();
    const setHidden = vi.fn();
    return { api: connect({ state: make(overrides), setSort, setHidden }), setSort, setHidden };
  };

  it("reflects aria-sort only on sortable columns", () => {
    const { api } = wire({ sort: { key: "name", direction: "asc" } });
    expect(api.getColumnHeaderProps("name")["aria-sort"]).toBe("ascending");
    expect(api.getColumnHeaderProps("age")["aria-sort"]).toBe("none");
    expect(api.getColumnHeaderProps("city")["aria-sort"]).toBeUndefined(); // not sortable
  });

  it("toggles sort when a sortable header button is clicked; ignores non-sortable", () => {
    const sortable = wire({ sort: null });
    (sortable.api.getSortButtonProps("name").onClick as () => void)();
    expect(sortable.setSort).toHaveBeenCalledWith({ key: "name", direction: "asc" });

    const notSortable = wire();
    notSortable.api.toggleSort("city");
    expect(notSortable.setSort).not.toHaveBeenCalled();
  });

  it("sortRows on the API uses the active sort", () => {
    const { api } = wire({ sort: { key: "name", direction: "asc" } });
    expect(api.sortRows(rows).map((r) => r.name)).toEqual(["Ada", "alan", "Grace"]);
  });
});

describe("table connect — column visibility", () => {
  const wire = (overrides = {}) => {
    const setSort = vi.fn();
    const setHidden = vi.fn();
    return { api: connect({ state: make(overrides), setSort, setHidden }), setHidden };
  };

  it("filters hidden columns out of visibleColumns", () => {
    const { api } = wire({ hiddenColumns: ["city"] });
    expect(api.visibleColumns.map((c) => c.key)).toEqual(["name", "age"]);
    expect(api.isColumnVisible("city")).toBe(false);
    expect(api.isColumnVisible("age")).toBe(true);
  });

  it("toggles a hideable column's visibility", () => {
    const { api, setHidden } = wire();
    api.toggleColumnVisibility("age");
    expect(setHidden).toHaveBeenCalledWith(["age"]);
  });

  it("never hides a non-hideable column", () => {
    const { api, setHidden } = wire();
    api.toggleColumnVisibility("name"); // hideable: false
    expect(setHidden).not.toHaveBeenCalled();
  });

  it("exposes checkbox semantics for the visibility toggle", () => {
    const { api } = wire({ hiddenColumns: ["city"] });
    expect(api.getVisibilityToggleProps("age")).toMatchObject({
      role: "menuitemcheckbox",
      "aria-checked": true,
    });
    expect(api.getVisibilityToggleProps("city")["aria-checked"]).toBe(false);
    expect(api.getVisibilityToggleProps("name").disabled).toBe(true); // not hideable
  });
});

describe("table state — row selection transitions", () => {
  it("toggles a row in and out in multiple mode, keeping selection order", () => {
    expect(toggleRowSelection([], 1, "multiple")).toEqual([1]);
    expect(toggleRowSelection([2, 1], 3, "multiple")).toEqual([2, 1, 3]);
    expect(toggleRowSelection([2, 1, 3], 1, "multiple")).toEqual([2, 3]);
  });

  it("replaces the selection in single mode, and empties it on a re-toggle", () => {
    expect(toggleRowSelection([], "a", "single")).toEqual(["a"]);
    expect(toggleRowSelection(["a"], "b", "single")).toEqual(["b"]);
    expect(toggleRowSelection(["b"], "b", "single")).toEqual([]);
  });

  it("returns the same array on every no-op", () => {
    const selected = [1, 2];
    expect(toggleRowSelection(selected, 3, "none")).toBe(selected);
    expect(toggleScopeSelection(selected, [3, 4], "none")).toBe(selected);
    expect(toggleScopeSelection(selected, [3, 4], "single")).toBe(selected);
    expect(toggleScopeSelection(selected, [], "multiple")).toBe(selected);
    expect(clearSelection([])).toEqual([]);
    const empty: (string | number)[] = [];
    expect(clearSelection(empty)).toBe(empty);
  });

  it("scope state: an empty scope is none, never a vacuous all", () => {
    expect(scopeSelectionState([1], [])).toBe("none");
    expect(scopeSelectionState([], [1, 2])).toBe("none");
    expect(scopeSelectionState([1], [1, 2])).toBe("some");
    expect(scopeSelectionState([2, 1], [1, 2])).toBe("all");
  });

  it("scope toggle appends the missing ids in scope order and preserves off-scope ids", () => {
    expect(toggleScopeSelection(["z", 2], [1, 2, 3], "multiple")).toEqual(["z", 2, 1, 3]);
  });

  it("scope toggle removes only the scope when it is fully selected", () => {
    expect(toggleScopeSelection(["z", 1, 2], [1, 2], "multiple")).toEqual(["z"]);
  });
});

describe("table connect — selection API", () => {
  const wire = (overrides = {}) => {
    const setSort = vi.fn();
    const setHidden = vi.fn();
    const setSelectedRowIds = vi.fn();
    const api = connect({ state: make(overrides), setSort, setHidden, setSelectedRowIds });
    return { api, setSelectedRowIds };
  };

  it("routes row and scope operations through the adapter setter", () => {
    const { api, setSelectedRowIds } = wire({ selectionMode: "multiple", selectedRowIds: [1] });
    api.toggleRowSelection(2);
    expect(setSelectedRowIds).toHaveBeenLastCalledWith([1, 2]);

    api.toggleScopeSelection([1, 2, 3]);
    expect(setSelectedRowIds).toHaveBeenLastCalledWith([1, 2, 3]);

    api.clearSelection();
    expect(setSelectedRowIds).toHaveBeenLastCalledWith([]);
  });

  it("never calls the setter on a no-op", () => {
    const { api, setSelectedRowIds } = wire({ selectionMode: "none", selectedRowIds: [1] });
    api.toggleRowSelection(2);
    api.toggleScopeSelection([2, 3]);
    expect(setSelectedRowIds).not.toHaveBeenCalled();

    const single = wire({ selectionMode: "single", selectedRowIds: ["a"] });
    single.api.toggleScopeSelection(["a", "b"]);
    expect(single.setSelectedRowIds).not.toHaveBeenCalled();

    const empty = wire({ selectionMode: "multiple" });
    empty.api.clearSelection();
    expect(empty.setSelectedRowIds).not.toHaveBeenCalled();
  });

  it("exposes membership and scope state", () => {
    const { api } = wire({ selectionMode: "multiple", selectedRowIds: [1, 3] });
    expect(api.isRowSelected(1)).toBe(true);
    expect(api.isRowSelected(2)).toBe(false);
    expect(api.getScopeSelectionState([1, 3])).toBe("all");
    expect(api.getScopeSelectionState([1, 2])).toBe("some");
    expect(api.getScopeSelectionState([])).toBe("none");
  });
});
