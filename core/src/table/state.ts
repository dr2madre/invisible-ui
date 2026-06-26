import type { SortState, TableContext, TableState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: TableContext): TableState {
  return {
    columns: context.columns,
    sort: context.sort ?? null,
    hiddenColumns: context.hiddenColumns ?? [],
    id: context.id ?? `ds-table-${++idCounter}`,
  };
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
      const result = compareValues(getValue(a.row, sort.key), getValue(b.row, sort.key));
      return result !== 0 ? result * factor : a.index - b.index; // stable tiebreak
    })
    .map((entry) => entry.row);
}
