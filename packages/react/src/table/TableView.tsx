import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../card/Card";
import { Checkbox, type CheckboxProps } from "../checkbox/Checkbox";
import { EmptyState } from "../empty-state/EmptyState";
import { useI18n } from "../i18n/i18n";
import { Icon } from "../icon/Icon";
import { useControllable } from "../internal/controllable";
import { fail } from "../internal/dev";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import { Pagination } from "../pagination/Pagination";
import { Popover } from "../popover/Popover";
import { SegmentedControl } from "../segmented-control/SegmentedControl";
import {
  cellText,
  defaultGetRowId,
  defaultGetValue,
  Table,
  type TableColumnDef,
  type TableRow,
} from "./Table";
import type { TableSetProps } from "./TableSet";
import { sameSort, useTable, type RowId, type SelectionMode, type SortState } from "./use-table";

/** The per-view configuration a `TableSet` forwards to the active view. */
export type TableViewConfig = Omit<
  TableSetProps,
  | "columns"
  | "rows"
  | "views"
  | "activeView"
  | "viewsLabel"
  | "onViewChange"
  | "title"
  | "titleLevel"
  | "caption"
  | "toolbar"
>;

export interface TableViewProps extends TableViewConfig {
  columns: TableColumnDef[];
  rows: TableRow[];
  caption?: string;
  /** Optional title, rendered on the same row as the view controls. */
  title?: string;
  titleLevel?: 2 | 3 | 4 | 5 | 6;
}

const anyRow = () => true;

// There is always an active sort: default to the first sortable column.
const defaultSort = (columns: TableColumnDef[]): SortState | null => {
  const key = columns.find((column) => column.sortable)?.key;
  return key ? { key, direction: "asc" } : null;
};

/**
 * Resolve each row's selection id. Selection needs an id that survives
 * sorting and paging, so the index fallback of the default `getRowId` is not
 * accepted here. A missing or duplicate id is an error in development; in
 * production the row is simply not selectable (first occurrence wins).
 */
function resolveSelectionIds(
  rows: TableRow[],
  mode: SelectionMode,
  getRowId: (row: TableRow, index: number) => string | number,
): Map<TableRow, RowId | null> {
  const ids = new Map<TableRow, RowId | null>();
  if (mode === "none") return ids;
  const seen = new Set<RowId>();
  rows.forEach((row, index) => {
    const id =
      getRowId === defaultGetRowId
        ? ((row.id as RowId | undefined) ?? null)
        : (getRowId(row, index) ?? null);
    if (id == null) {
      fail("Row selection needs a stable id: add `row.id` or pass a stable `getRowId`.");
      ids.set(row, null);
      return;
    }
    if (seen.has(id)) {
      fail(`Duplicate row id "${String(id)}": row selection needs unique ids.`);
      ids.set(row, null);
      return;
    }
    seen.add(id);
    ids.set(row, id);
  });
  return ids;
}

function SettingsGlyph() {
  return (
    <Icon size="1.15em">
      <line x1="21" y1="4" x2="14" y2="4" />
      <line x1="10" y1="4" x2="3" y2="4" />
      <line x1="21" y1="12" x2="12" y2="12" />
      <line x1="8" y1="12" x2="3" y2="12" />
      <line x1="21" y1="20" x2="16" y2="20" />
      <line x1="12" y1="20" x2="3" y2="20" />
      <line x1="14" y1="2" x2="14" y2="6" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="16" y1="18" x2="16" y2="22" />
    </Icon>
  );
}

/**
 * The page a view shows, as a controllable mirror (data-table spec, task 5A).
 *
 * A later `page` prop overwrites it; a change of the filter signal resets it
 * to one; a page count that shrinks under it clamps it. The last two are the
 * component moving the page, so they report through `onPageChange`, once and
 * after the render that moved it commits. All three settle while rendering,
 * in that order, so a reset wins over a page prop that arrives with it.
 */
function usePageMirror(
  pageProp: number,
  pageCount: number,
  filterSignal: readonly [boolean, string | number | undefined],
  onPageChange: ((page: number) => void) | undefined,
): [page: number, setPage: (page: number) => void] {
  // `report` marks a page the component chose; each one is a new object, so
  // the effect below reports it once and an unrelated render reports nothing.
  const [state, setState] = useState({ page: pageProp, report: false });
  const [lastProp, setLastProp] = useState(pageProp);
  const [lastSignal, setLastSignal] = useState(filterSignal);

  let page = state.page;
  let report = false;
  if (pageProp !== lastProp) {
    setLastProp(pageProp);
    page = pageProp;
  }
  if (filterSignal[0] !== lastSignal[0] || !Object.is(filterSignal[1], lastSignal[1])) {
    setLastSignal(filterSignal);
    if (page !== 1) {
      page = 1;
      report = true;
    }
  }
  if (page > pageCount) {
    page = pageCount;
    report = true;
  }
  if (page !== state.page) setState({ page, report });

  const reportPage = useRef(onPageChange);
  useIsomorphicLayoutEffect(() => {
    reportPage.current = onPageChange;
  });
  useEffect(() => {
    if (state.report) reportPage.current?.(state.page);
  }, [state]);

  const setPage = (next: number) => {
    setState({ page: next, report: false });
    onPageChange?.(next);
  };
  return [page, setPage];
}

/**
 * TableView: internal, the single-view body used by `TableSet`. It owns the
 * headless table state (sorting, column visibility, selection) for one set of
 * `columns` and `rows` and renders a header row (optional title, a table and
 * cards switch, a column-settings button), the body (a `Table` inside a card,
 * or a list of `Card`s) and, outside it, the footer (pagination or infinite
 * loading). `TableSet` adds the tabs that swap between several views. Kept out
 * of the package's public exports.
 */
export function TableView({
  columns,
  rows,
  caption,
  hideCaption = false,
  title,
  titleLevel = 2,
  pageSize,
  page = 1,
  paginationLabel,
  onPageChange,
  infinite = false,
  hasMore = false,
  loading = false,
  onLoadMore,
  loadMoreLabel,
  loadingLabel,
  sort = null,
  onSortChange,
  hiddenColumns,
  onHiddenColumnsChange,
  view = "table",
  allowViewToggle = false,
  configurable = false,
  configLabel,
  cardTitleKey,
  cardDescriptionKey,
  getValue = defaultGetValue,
  getRowId = defaultGetRowId,
  selectionMode = "none",
  selectedRowIds,
  onSelectedRowIdsChange,
  isRowSelectable = anyRow,
  getRowLabel,
  filtersActive = false,
  totalRowCount,
  filterRevision,
  onClearFilters,
  noResultsLabel,
  renderCell,
}: TableViewProps) {
  const { t } = useI18n();

  // A `null` sort means the default one: the mirror compares by content, so
  // the default recomputed on every render reflects only when it changes.
  const { api, setSort, syncSort } = useTable({
    columns,
    sort: sort ?? defaultSort(columns),
    hiddenColumns,
    selectionMode,
    selectedRowIds,
    onSortChange,
    onHiddenColumnsChange,
    onSelectedRowIdsChange,
  });

  // New columns keep the current sort while its key is still sortable;
  // otherwise the first sortable column takes over, without a callback.
  const [lastColumns, setLastColumns] = useState(columns);
  if (columns !== lastColumns) {
    setLastColumns(columns);
    const current = api.sort;
    const stillSortable =
      current != null && columns.some((column) => column.key === current.key && column.sortable);
    const fallback = defaultSort(columns);
    if (!stillSortable && !sameSort(current, fallback)) syncSort(fallback);
  }

  // Two-state toggle (ascending and descending): the view is never unsorted.
  const toggleSort = (key: string) => {
    const current = api.sort;
    setSort(
      current && current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  // The view is local until the prop changes again; reflecting never reports.
  const [currentView, setCurrentView] = useControllable(view, undefined);

  const paginated = !infinite && pageSize != null;
  const sortedRows = useMemo(() => api.sortRows(rows, getValue), [api, rows, getValue]);
  const pageCount = paginated ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;
  const [currentPage, changePage] = usePageMirror(
    page,
    pageCount,
    [filtersActive, filterRevision],
    onPageChange,
  );
  const visibleRows = paginated
    ? sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedRows;

  // Zero rows means "no results" only while filters are active and the
  // dataset itself is not empty; an unknown total counts as not empty.
  const noResults = rows.length === 0 && filtersActive && totalRowCount !== 0;

  // The built-in clear action unmounts with the panel, so focus would fall to
  // the body. When content returns after that action, the view root takes it.
  const rootRef = useRef<HTMLDivElement>(null);
  const focusAfterClear = useRef(false);
  const clearFilters = () => {
    focusAfterClear.current = true;
    onClearFilters?.();
  };
  const hasRows = rows.length > 0;
  useEffect(() => {
    if (focusAfterClear.current && hasRows) {
      focusAfterClear.current = false;
      rootRef.current?.focus();
    }
  }, [hasRows]);

  // The sentinel loads more as soon as the end of the list comes into view.
  // The observer starts again whenever loading ends or more rows arrive: a
  // fresh observer reports the current intersection, so a sentinel that never
  // left the view asks again.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMore = useRef(onLoadMore);
  useIsomorphicLayoutEffect(() => {
    loadMore.current = onLoadMore;
  });
  useEffect(() => {
    const node = sentinelRef.current;
    if (!infinite || !node || !hasMore || loading || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore.current?.();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [infinite, hasMore, loading]);

  const selectionIds = useMemo(
    () => resolveSelectionIds(rows, selectionMode, getRowId),
    [rows, selectionMode, getRowId],
  );
  const selectionActive = selectionMode !== "none";

  const selectionLabel = (row: TableRow, rowId: RowId): string => {
    const label = getRowLabel?.(row);
    if (label == null || label.trim() === "") {
      fail("Row selection needs `getRowLabel` returning a non-empty name for every row.");
      return String(rowId);
    }
    return label;
  };

  // Select-all only ever addresses the rendered slice.
  const scopeIds =
    selectionMode === "multiple"
      ? visibleRows.flatMap((row) => {
          const id = selectionIds.get(row);
          return id != null && isRowSelectable(row) ? [id] : [];
        })
      : [];
  const scopeState = selectionMode === "multiple" ? api.getScopeSelectionState(scopeIds) : "none";
  const selectAllChecked: CheckboxProps["checked"] =
    scopeState === "all" ? true : scopeState === "some" ? "indeterminate" : false;

  const selectAll = (hideLabel: boolean) => (
    <Checkbox
      hideLabel={hideLabel}
      label={t("table.selectPage")}
      checked={selectAllChecked}
      disabled={scopeIds.length === 0}
      onCheckedChange={() => api.toggleScopeSelection(scopeIds)}
    />
  );

  const rowCheckbox = (row: TableRow) => {
    const id = selectionIds.get(row);
    if (id == null || !isRowSelectable(row)) return null;
    return (
      <Checkbox
        hideLabel
        label={t("table.selectRow", { name: selectionLabel(row, id) })}
        checked={api.isRowSelected(id)}
        onCheckedChange={() => api.toggleRowSelection(id)}
      />
    );
  };

  const isSelected = (row: TableRow) => {
    const id = selectionIds.get(row);
    return id != null && api.isRowSelected(id);
  };

  const shownColumns = columns.filter((column) => api.isColumnVisible(column.key));
  const titleKey = cardTitleKey ?? columns[0]?.key;
  const fieldColumns = shownColumns.filter(
    (column) => column.key !== titleKey && column.key !== cardDescriptionKey,
  );
  const configName = configLabel ?? t("table.columns");
  const loadingText = loadingLabel ?? t("table.loading");
  const TitleTag = `h${titleLevel}` as const;

  return (
    <div className="table-view" tabIndex={-1} ref={rootRef}>
      {title || allowViewToggle || configurable ? (
        <header className="table-view__header">
          {title ? <TitleTag className="table-view__title">{title}</TitleTag> : null}
          <div className="table-view__controls">
            {allowViewToggle ? (
              <SegmentedControl
                items={[
                  { value: "table", label: t("table.viewTable") },
                  { value: "card", label: t("table.viewCards") },
                ]}
                value={currentView}
                label={t("table.view")}
                hideLabel
                onValueChange={(next) => setCurrentView(next === "card" ? "card" : "table")}
              />
            ) : null}
            {configurable ? (
              <Popover
                placement="bottom-end"
                triggerContent={
                  <span className="table-view__settings">
                    <SettingsGlyph />
                    <span className="table-view__sr">{configName}</span>
                  </span>
                }
              >
                <div className="table-view__config-list" role="group" aria-label={configName}>
                  {columns.map((column) => (
                    <Checkbox
                      key={column.key}
                      label={column.header}
                      checked={api.isColumnVisible(column.key)}
                      disabled={column.hideable === false}
                      onCheckedChange={() => api.toggleColumnVisibility(column.key)}
                    />
                  ))}
                </div>
              </Popover>
            ) : null}
          </div>
        </header>
      ) : null}

      {noResults ? (
        <div className="table-view__no-results">
          <EmptyState
            title={noResultsLabel ?? t("table.noResults")}
            actionLabel={onClearFilters ? t("table.clearFilters") : undefined}
            onAction={onClearFilters ? clearFilters : undefined}
          />
        </div>
      ) : currentView === "card" ? (
        <>
          {selectionMode === "multiple" ? (
            <div className="table-view__cards-select-all">{selectAll(false)}</div>
          ) : null}
          <div className="table-view__cards" role="list" aria-label={caption}>
            {visibleRows.map((row, rowIndex) => {
              const checkbox = selectionActive ? rowCheckbox(row) : null;
              return (
                <div
                  key={getRowId(row, rowIndex)}
                  role="listitem"
                  className={checkbox ? "table-view__card-item" : undefined}
                  data-selected={selectionActive && isSelected(row) ? "" : undefined}
                >
                  {checkbox}
                  <Card
                    title={titleKey != null ? cellText(getValue(row, titleKey)) : undefined}
                    description={
                      cardDescriptionKey != null
                        ? cellText(getValue(row, cardDescriptionKey))
                        : undefined
                    }
                  >
                    <dl className="table-view__card-fields">
                      {fieldColumns.map((column) => {
                        const value = getValue(row, column.key);
                        return (
                          <div key={column.key} className="table-view__card-field">
                            <dt className="table-view__card-label">{column.header}</dt>
                            <dd className="table-view__card-value">
                              {renderCell
                                ? renderCell({ row, column, value, rowIndex })
                                : cellText(value)}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </Card>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="table-view__card">
          <Table
            columns={shownColumns}
            rows={visibleRows}
            sort={api.sort}
            onSortToggle={toggleSort}
            caption={caption}
            hideCaption={hideCaption || Boolean(title)}
            getValue={getValue}
            getRowId={getRowId}
            selectionColumn={selectionActive}
            isRowSelected={selectionActive ? isSelected : undefined}
            renderCell={renderCell}
            selectionHeader={
              selectionMode === "multiple" ? (
                selectAll(true)
              ) : (
                <span className="table-view__sr">{t("table.selection")}</span>
              )
            }
            renderSelectionCell={({ row }) => rowCheckbox(row)}
          />
        </div>
      )}

      {infinite ? (
        <div className="table-view__infinite">
          <p className="table-view__status" role="status" aria-live="polite">
            {loading ? loadingText : ""}
          </p>
          {hasMore ? (
            <button
              type="button"
              className="table-view__load-more"
              disabled={loading}
              onClick={() => onLoadMore?.()}
            >
              {loading ? loadingText : (loadMoreLabel ?? t("table.loadMore"))}
            </button>
          ) : null}
          <div className="table-view__sentinel" ref={sentinelRef} aria-hidden="true" />
        </div>
      ) : paginated && pageCount > 1 ? (
        <div className="table-view__pagination">
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            label={paginationLabel ?? t("table.pagination")}
            onPageChange={changePage}
          />
        </div>
      ) : null}
    </div>
  );
}
