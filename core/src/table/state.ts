import type { RowId, SelectionMode, SortState, TableContext, TableState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: TableContext): TableState {
  return {
    columns: context.columns,
    sort: context.sort ?? null,
    hiddenColumns: context.hiddenColumns ?? [],
    selectionMode: context.selectionMode ?? "none",
    selectedRowIds: context.selectedRowIds ?? [],
    id: context.id ?? `ds-table-${++idCounter}`,
  };
}

/**
 * Pure transition: toggle one row in the selection. In `single` mode a new id
 * replaces the selection and re-toggling the selected id empties it. A no-op
 * (mode `none`) returns the same array, so callers can skip their setters.
 */
export function toggleRowSelection(selected: RowId[], id: RowId, mode: SelectionMode): RowId[] {
  if (mode === "none") return selected;
  const has = selected.includes(id);
  if (mode === "single") return has ? [] : [id];
  return has ? selected.filter((existing) => existing !== id) : [...selected, id];
}

/**
 * Pure transition: toggle a whole scope (the selectable rows on the rendered
 * page). Only `multiple` mode operates on a scope; ids outside the scope are
 * always preserved, and new ids append in scope order. A no-op returns the
 * same array.
 */
export function toggleScopeSelection(
  selected: RowId[],
  scope: RowId[],
  mode: SelectionMode,
): RowId[] {
  if (mode !== "multiple" || scope.length === 0) return selected;
  const selectedSet = new Set(selected);
  const allSelected = scope.every((id) => selectedSet.has(id));
  if (allSelected) {
    const scopeSet = new Set(scope);
    return selected.filter((id) => !scopeSet.has(id));
  }
  const missing = scope.filter((id) => !selectedSet.has(id));
  return missing.length === 0 ? selected : [...selected, ...missing];
}

/** How much of a scope is selected. An empty scope is "none", never "all". */
export function scopeSelectionState(selected: RowId[], scope: RowId[]): "none" | "some" | "all" {
  if (scope.length === 0) return "none";
  const selectedSet = new Set(selected);
  const count = scope.filter((id) => selectedSet.has(id)).length;
  if (count === 0) return "none";
  return count === scope.length ? "all" : "some";
}

/** Pure transition: empty the selection. Already empty returns the same array. */
export function clearSelection(selected: RowId[]): RowId[] {
  return selected.length === 0 ? selected : [];
}

/** Toggle a column key in/out of the hidden set. */
export function toggleHidden(hidden: string[], key: string): string[] {
  return hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
}

/**
 * The sort after clicking a column header: a three-state cycle —
 * unsorted → ascending → descending → unsorted (for the same column). Clicking a
 * different column starts a fresh ascending sort.
 */
export function nextSort(current: SortState | null, key: string): SortState | null {
  if (!current || current.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}

/**
 * Compare two cell values for sorting. Numbers and dates compare numerically,
 * strings case-insensitively by locale; nullish values sort to the end.
 */
export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Return a new array of rows sorted by `sort`. When `sort` is `null` the
 * original order is preserved. `getValue` reads a row's value for a column key
 * (defaults to `row[key]`). The sort is stable.
 */
export function sortRows<T>(
  rows: T[],
  sort: SortState | null,
  getValue: (row: T, key: string) => unknown = (row, key) => (row as Record<string, unknown>)[key],
): T[] {
  if (!sort) return rows.slice();
  const factor = sort.direction === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const aValue = getValue(a.row, sort.key);
      const bValue = getValue(b.row, sort.key);
      const result = compareValues(aValue, bValue);
      if (result === 0) return a.index - b.index; // stable tiebreak
      // Nullish values stay at the end in both directions; only concrete
      // values reverse for descending order.
      return aValue == null || bValue == null ? result : result * factor;
    })
    .map((entry) => entry.row);
}
