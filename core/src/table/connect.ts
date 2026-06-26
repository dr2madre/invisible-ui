import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { nextSort, sortRows, toggleHidden } from "./state";
import type { SortState, TableColumn, TableState } from "./types";

/** The public, framework-agnostic API for a connected table. */
export interface TableApi {
  /** The active sort, or `null`. */
  sort: SortState | null;
  /** Set the sort directly (or clear with `null`). */
  setSort(sort: SortState | null): void;
  /** Cycle a column's sort (unsorted → asc → desc → unsorted). */
  toggleSort(key: string): void;
  /** Return a new array of rows sorted by the active sort (stable). */
  sortRows<T>(rows: T[], getValue?: (row: T, key: string) => unknown): T[];
  /** Keys of the hidden columns. */
  hiddenColumns: string[];
  /** The columns currently shown, in order (hidden ones removed). */
  visibleColumns: TableColumn[];
  /** Whether a column is currently shown. */
  isColumnVisible(key: string): boolean;
  /** Show/hide a column (no-op for non-hideable columns). */
  toggleColumnVisibility(key: string): void;
  /** Props for the `<th>` of a column header. */
  getColumnHeaderProps(key: string): ElementProps;
  /** Props for the sort-toggle `<button>` inside a sortable header. */
  getSortButtonProps(key: string): ElementProps;
  /** Props for a column-visibility toggle (a checkbox in a config menu). */
  getVisibilityToggleProps(key: string): ElementProps;
}

export interface ConnectOptions {
  state: TableState;
  /** Request a new sort; the adapter owns how state updates. */
  setSort: (sort: SortState | null) => void;
  /** Request a new hidden-column set; the adapter owns how state updates. */
  setHidden: (hidden: string[]) => void;
  normalize?: Normalize;
}

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

/**
 * Connect table state to prop getters. Sorting follows the native pattern: each
 * sortable column header (`<th>`) carries `aria-sort` reflecting the active
 * direction, and contains a button that cycles the sort on activation.
 */
export function connect({
  state,
  setSort,
  setHidden,
  normalize = identityNormalize,
}: ConnectOptions): TableApi {
  const { columns, sort, hiddenColumns } = state;

  const isSortable = (key: string) => columns.find((c) => c.key === key)?.sortable ?? false;
  const isHideable = (key: string) => columns.find((c) => c.key === key)?.hideable ?? true;
  const isColumnVisible = (key: string) => !hiddenColumns.includes(key);
  const toggleSort = (key: string) => {
    if (!isSortable(key)) return;
    setSort(nextSort(sort, key));
  };
  const toggleColumnVisibility = (key: string) => {
    if (!isHideable(key)) return;
    setHidden(toggleHidden(hiddenColumns, key));
  };

  return {
    sort,
    setSort,
    toggleSort,
    sortRows: (rows, getValue) => sortRows(rows, sort, getValue),
    hiddenColumns,
    visibleColumns: columns.filter((c) => isColumnVisible(c.key)),
    isColumnVisible,
    toggleColumnVisibility,
    getColumnHeaderProps: (key: string) => {
      const sortable = isSortable(key);
      const active = sort?.key === key;
      return normalize({
        scope: "col",
        "aria-sort": sortable ? (active ? ARIA_SORT[sort!.direction] : "none") : undefined,
        "data-sortable": sortable ? "" : undefined,
        "data-sort-direction": active ? sort!.direction : undefined,
      });
    },
    getSortButtonProps: (key: string) => {
      const active = sort?.key === key;
      return normalize({
        type: "button",
        "data-sort-direction": active ? sort!.direction : undefined,
        onClick: () => toggleSort(key),
      });
    },
    getVisibilityToggleProps: (key: string) => {
      const visible = isColumnVisible(key);
      const hideable = isHideable(key);
      return normalize({
        type: "button",
        role: "menuitemcheckbox",
        "aria-checked": visible,
        disabled: hideable ? undefined : true,
        "data-checked": visible ? "" : undefined,
        "data-value": key,
        onClick: () => toggleColumnVisibility(key),
      });
    },
  };
}
