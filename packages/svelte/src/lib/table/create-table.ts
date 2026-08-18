import { table as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type SortDirection = core.SortDirection;
export type SortState = core.SortState;
export type TableColumn = core.TableColumn;
export type TableApi = core.TableApi;
export type TableState = core.TableState;
export type TableContext = core.TableContext;

export interface CreateTable {
  /** Reactive resolved state. */
  state: Readable<TableState>;
  /** Reactive connected API. */
  api: Readable<TableApi>;
  /** The active sort (or `null`). */
  sort: Readable<SortState | null>;
  /** The hidden-column keys. */
  hiddenColumns: Readable<string[]>;
  /** Cycle a column's sort. */
  toggleSort: (key: string) => void;
  /** Set the sort directly (or clear with `null`). */
  setSort: (sort: SortState | null) => void;
  /** Show/hide a column. */
  toggleColumnVisibility: (key: string) => void;
  /** Sync an externally-controlled sort without emitting a change event. */
  syncSort: (sort: SortState | null) => void;
  /** Sync externally-controlled hidden columns without emitting a change event. */
  syncHiddenColumns: (hidden: string[]) => void;
  /** Replace the column definitions (e.g. when the consumer's columns change). */
  syncColumns: (columns: TableColumn[]) => void;
  /** Action for a column header `<th>`: `<th use:headerAction={key}>`. */
  headerAction: Action<HTMLElement, string>;
  /** Action for a sort-toggle `<button>`: `<button use:sortButtonAction={key}>`. */
  sortButtonAction: Action<HTMLElement, string>;
  /** Action for a column-visibility toggle: `<button use:visibilityToggleAction={key}>`. */
  visibilityToggleAction: Action<HTMLElement, string>;
}

/**
 * Create a headless table: column sort state with a three-state cycle and the
 * native sortable-header semantics (`aria-sort`). The sort logic and comparators
 * live in `@design-system/core`; this adapter wires state to Svelte stores and
 * applies the connected props via actions. Use the connected API's `sortRows` to
 * derive the rows to render.
 */
export function createTable(context: TableContext): CreateTable {
  const state = writable<TableState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-table") }),
  );

  const sortEquals = (a: SortState | null, b: SortState | null) =>
    a === b || (a != null && b != null && a.key === b.key && a.direction === b.direction);

  const hiddenEquals = (a: string[], b: string[]) =>
    a === b || (a.length === b.length && a.every((key, index) => key === b[index]));

  const updateSort = (sort: SortState | null, notify: boolean) => {
    state.update((current) => {
      if (sortEquals(current.sort, sort)) return current;
      if (notify) context.onSortChange?.(sort);
      return { ...current, sort };
    });
  };

  const updateHidden = (hidden: string[], notify: boolean) => {
    state.update((current) => {
      if (hiddenEquals(current.hiddenColumns, hidden)) return current;
      if (notify) context.onHiddenColumnsChange?.(hidden);
      return { ...current, hiddenColumns: hidden };
    });
  };

  const setSort = (sort: SortState | null) => updateSort(sort, true);
  const setHidden = (hidden: string[]) => updateHidden(hidden, true);

  const syncColumns = (columns: TableColumn[]) =>
    state.update((current) => (current.columns === columns ? current : { ...current, columns }));

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setSort, setHidden, normalize: normalizeProps }),
  );

  const headerAction: Action<HTMLElement, string> = (node, key) => {
    const headerApi = derived(api, (a) => a.getColumnHeaderProps(key as string));
    const handle = createPropsAction(headerApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  const sortButtonAction: Action<HTMLElement, string> = (node, key) => {
    const buttonApi = derived(api, (a) => a.getSortButtonProps(key as string));
    const handle = createPropsAction(buttonApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  const visibilityToggleAction: Action<HTMLElement, string> = (node, key) => {
    const toggleApi = derived(api, (a) => a.getVisibilityToggleProps(key as string));
    const handle = createPropsAction(toggleApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    sort: derived(state, ($state) => $state.sort),
    hiddenColumns: derived(state, ($state) => $state.hiddenColumns),
    toggleSort: (key: string) => get(api).toggleSort(key),
    setSort,
    toggleColumnVisibility: (key: string) => get(api).toggleColumnVisibility(key),
    syncSort: (sort: SortState | null) => updateSort(sort, false),
    syncHiddenColumns: (hidden: string[]) => updateHidden(hidden, false),
    syncColumns,
    headerAction,
    sortButtonAction,
    visibilityToggleAction,
  };
}
