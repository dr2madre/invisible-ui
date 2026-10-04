import { table as core } from "@design-system/core";
import { useId, useMemo, useState } from "react";
import { sameList, useControllable } from "../internal/controllable";
import { fail } from "../internal/dev";
import { normalizeProps } from "../normalize";

export type TableApi = core.TableApi;
export type RowId = core.RowId;
export type SelectionMode = core.SelectionMode;
export type SortDirection = core.SortDirection;

/**
 * The active sort: which column and which direction. Structurally identical
 * to the core's `SortState`, declared here so the published declarations name
 * it without reaching into the core's namespace.
 */
export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface UseTableOptions {
  /** The columns, as the core needs them: key, `sortable`, `hideable`. */
  columns: core.TableColumn[];
  /** Active sort (controllable mirror), or `null` for none. */
  sort?: SortState | null;
  /** Hidden column keys (controllable mirror). */
  hiddenColumns?: string[];
  /** Called whenever the sort changes (including cleared to `null`). */
  onSortChange?: (sort: SortState | null) => void;
  /** Called whenever the hidden-column set changes. */
  onHiddenColumnsChange?: (hidden: string[]) => void;
  /** Row selection mode. Defaults to `none`. Changing it never touches the selection. */
  selectionMode?: SelectionMode;
  /** Selected row ids (controllable mirror). */
  selectedRowIds?: RowId[];
  /** Called with the next ids after a user selection action. */
  onSelectedRowIdsChange?: (ids: RowId[]) => void;
}

export interface UseTable {
  /** The connected API: sorting, visibility, selection and the header prop bags. */
  api: TableApi;
  /** Set the sort directly (or clear it with `null`), reporting the change. */
  setSort: (sort: SortState | null) => void;
  /** Put a sort in place without reporting it, e.g. a default the component chose. */
  syncSort: (sort: SortState | null) => void;
}

const EMPTY: never[] = [];

export const sameSort = (a: SortState | null, b: SortState | null): boolean =>
  a === b || (a != null && b != null && a.key === b.key && a.direction === b.direction);

/**
 * The selection contract keeps ids unique; a controlled value that already
 * carries duplicates is a consumer error. Development fails, production keeps
 * the value untouched (selection data is never pruned).
 */
function assertUniqueSelection(ids: RowId[]): void {
  if (new Set(ids).size !== ids.length) {
    fail("`selectedRowIds` must not contain duplicate ids.");
  }
}

/**
 * Connect the headless table to React: column sort, column visibility and row
 * selection, plus the native sortable-header semantics (`aria-sort`). The sort
 * logic and comparators live in `@design-system/core`. Each piece of state is
 * a controllable mirror (ADR 0011): a later prop is reflected without a
 * report, and a user action reports once. Use the connected API's `sortRows`
 * to derive the rows to render.
 */
export function useTable({
  columns,
  sort: sortProp = null,
  hiddenColumns: hiddenProp = EMPTY,
  onSortChange,
  onHiddenColumnsChange,
  selectionMode = "none",
  selectedRowIds: selectedProp = EMPTY,
  onSelectedRowIdsChange,
}: UseTableOptions): UseTable {
  const id = `ds-table-${useId()}`;
  const [sort, setSort, syncSort] = useControllable(sortProp, onSortChange, sameSort);
  const [hiddenColumns, setHidden] = useControllable(hiddenProp, onHiddenColumnsChange, sameList);
  const [selectedRowIds, setSelectedRowIds] = useControllable(
    selectedProp,
    onSelectedRowIdsChange,
    sameList,
  );

  // Checked once per distinct controlled value, never on an unrelated render.
  const [checkedSelection, setCheckedSelection] = useState(() => {
    assertUniqueSelection(selectedProp);
    return selectedProp;
  });
  if (checkedSelection !== selectedProp) {
    setCheckedSelection(selectedProp);
    assertUniqueSelection(selectedProp);
  }

  const api = useMemo(
    () =>
      core.connect({
        state: { columns, sort, hiddenColumns, selectionMode, selectedRowIds, id },
        setSort,
        setHidden,
        setSelectedRowIds,
        normalize: normalizeProps,
      }),
    [
      columns,
      sort,
      hiddenColumns,
      selectionMode,
      selectedRowIds,
      id,
      setSort,
      setHidden,
      setSelectedRowIds,
    ],
  );

  return { api, setSort, syncSort };
}
