import { table as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";
import type { SortState, TableColumnDef } from "./Table";

export type TableApi = core.TableApi;
export type RowId = core.RowId;
export type SelectionMode = core.SelectionMode;

export interface UseTableOptions {
  columns: TableColumnDef[];
  /** Active sort (controllable mirror), or `null` for none. */
  sort?: SortState | null;
  /** Hidden column keys (controllable mirror). */
  hiddenColumns?: string[];
  /** Called whenever the sort changes (including cleared to `null`). */
  onSortChange?: (sort: SortState | null) => void;
  /** Called whenever the hidden-column set changes. */
  onHiddenColumnsChange?: (hidden: string[]) => void;
  /** Row selection mode (controllable mirror). Defaults to `none`. */
  selectionMode?: SelectionMode;
  /** Selected row ids (controllable mirror). */
  selectedRowIds?: RowId[];
  /** Called with the next ids after a user selection action. */
  onSelectedRowIdsChange?: (ids: RowId[]) => void;
}

export interface UseTable {
  /** Reactive connected API: sorting, visibility and the header prop bags. */
  api: ComputedRef<TableApi>;
  /** Set the sort directly (or clear it with `null`). */
  setSort: (sort: SortState | null) => void;
  /** Sync an externally-controlled sort without emitting a change event. */
  syncSort: (sort: SortState | null) => void;
  /** Show or hide a column (no-op for non-hideable columns). */
  toggleColumnVisibility: (key: string) => void;
  /** Sync externally-controlled selected row ids without emitting a change event. */
  syncSelectedRowIds: (ids: RowId[]) => void;
}

/**
 * Connect the headless table to Vue: column sort state and column visibility,
 * plus the native sortable-header semantics (`aria-sort`). The sort logic and
 * comparators live in `@design-system/core`; this composable owns the resolved
 * state (mirroring controlled `sort` / `hiddenColumns` with watches) and derives
 * the connected props with `computed(connect)`. Use the connected API's
 * `sortRows` to derive the rows to render.
 */
export function useTable(options: MaybeRefOrGetter<UseTableOptions>): UseTable {
  const resolved = computed(() => toValue(options));
  // One seeding pass fixes the id, so later states reuse it instead of drawing
  // a fresh one from the core's counter on every recompute.
  const seed = core.initialState({ ...resolved.value, id: useStableId("ds-table") });
  const sort = ref<SortState | null>(seed.sort);
  const hiddenColumns = ref<string[]>(seed.hiddenColumns);
  const selectionMode = ref<SelectionMode>(seed.selectionMode);
  const selectedRowIds = ref<RowId[]>(seed.selectedRowIds);

  watch(
    () => resolved.value.sort,
    (next) => {
      if (next !== undefined) sort.value = next;
    },
  );

  watch(
    () => resolved.value.hiddenColumns,
    (next) => {
      if (next) hiddenColumns.value = next;
    },
  );

  // Changing the mode never touches the selection and never notifies.
  watch(
    () => resolved.value.selectionMode,
    (next) => {
      if (next !== undefined) selectionMode.value = next;
    },
  );

  watch(
    () => resolved.value.selectedRowIds,
    (next) => {
      if (next) syncSelectedRowIds(next);
    },
  );

  const sortEquals = (a: SortState | null, b: SortState | null) =>
    a === b || (a != null && b != null && a.key === b.key && a.direction === b.direction);

  const setSort = (next: SortState | null) => {
    if (sortEquals(sort.value, next)) return;
    sort.value = next;
    resolved.value.onSortChange?.(next);
  };

  const syncSort = (next: SortState | null) => {
    if (!sortEquals(sort.value, next)) sort.value = next;
  };

  const setHidden = (next: string[]) => {
    if (
      hiddenColumns.value === next ||
      (hiddenColumns.value.length === next.length &&
        hiddenColumns.value.every((key, index) => key === next[index]))
    ) {
      return;
    }
    hiddenColumns.value = next;
    resolved.value.onHiddenColumnsChange?.(next);
  };

  const selectionEquals = (a: RowId[], b: RowId[]) =>
    a === b || (a.length === b.length && a.every((id, index) => id === b[index]));

  const setSelectedRowIds = (next: RowId[]) => {
    if (selectionEquals(selectedRowIds.value, next)) return;
    selectedRowIds.value = next;
    resolved.value.onSelectedRowIdsChange?.(next);
  };

  const syncSelectedRowIds = (next: RowId[]) => {
    if (!selectionEquals(selectedRowIds.value, next)) selectedRowIds.value = next;
  };

  const api = computed(() =>
    core.connect({
      state: {
        columns: resolved.value.columns,
        sort: sort.value,
        hiddenColumns: hiddenColumns.value,
        selectionMode: selectionMode.value,
        selectedRowIds: selectedRowIds.value,
        id: seed.id,
      },
      setSort,
      setHidden,
      setSelectedRowIds,
      normalize: normalizeProps,
    }),
  );

  return {
    api,
    setSort,
    syncSort,
    toggleColumnVisibility: (key: string) => api.value.toggleColumnVisibility(key),
    syncSelectedRowIds,
  };
}
