import { table as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";
import type { SortState, TableColumnDef } from "./Table";

export type TableApi = core.TableApi;

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

  const api = computed(() =>
    core.connect({
      state: {
        columns: resolved.value.columns,
        sort: sort.value,
        hiddenColumns: hiddenColumns.value,
        id: seed.id,
      },
      setSort,
      setHidden,
      normalize: normalizeProps,
    }),
  );

  return {
    api,
    setSort,
    syncSort,
    toggleColumnVisibility: (key: string) => api.value.toggleColumnVisibility(key),
  };
}
