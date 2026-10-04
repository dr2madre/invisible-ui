import { useMemo, useState, type ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { useTabs } from "../tabs/use-tabs";
import type { TableCellContext, TableColumnDef, TableRow } from "./Table";
import type { RowId, SelectionMode, SortState } from "./use-table";
import { TableView } from "./TableView";

/** A named table view (a tab): its own columns and rows. */
export interface TableViewDef {
  /** Stable id (the tab value). */
  id: string;
  /** Tab label. */
  label: string;
  columns: TableColumnDef[];
  rows: TableRow[];
  /** Optional accessible name for this view's table or list (defaults to `label`). */
  caption?: string;
}

export interface TableSetProps {
  /** Single-view columns (used when `views` is not provided). */
  columns?: TableColumnDef[];
  /** Single-view rows (used when `views` is not provided). */
  rows?: TableRow[];
  /** Distinct views shown as tabs; each supplies its own columns and rows. */
  views?: TableViewDef[];
  /**
   * The active view id. Controllable mirror: selecting a tab updates it
   * locally and reports through `onViewChange`; a later prop value overwrites
   * the local choice without a callback. Defaults to the first view.
   */
  activeView?: string;
  /** Accessible name for the views tab list. Defaults to the catalog's "Views". */
  viewsLabel?: string;
  /** Called when the user selects another view. */
  onViewChange?: (id: string) => void;
  /** Optional title shown in the header (rendered as a heading). */
  title?: string;
  titleLevel?: 2 | 3 | 4 | 5 | 6;
  /** Accessible name for the table or list (a `<caption>` in table view). */
  caption?: string;
  /** Header content beside the title, such as filters or actions. */
  toolbar?: ReactNode;
  /** Visually hide the caption (still available to assistive tech). */
  hideCaption?: boolean;
  /** Rows per page. Without it, every row shows. */
  pageSize?: number;
  /** The current page (controllable mirror). Defaults to `1`. */
  page?: number;
  /** Accessible name for the pagination nav. Defaults to the catalog's "Table pages". */
  paginationLabel?: string;
  /** Called with the page after a user action, or after the component moved it. */
  onPageChange?: (page: number) => void;
  /** Load rows on demand instead of paging them. */
  infinite?: boolean;
  /** Infinite mode: more rows are available. */
  hasMore?: boolean;
  /** Infinite mode: rows are loading. */
  loading?: boolean;
  /** Infinite mode: called when the user, or the end of the list, asks for more. */
  onLoadMore?: () => void;
  /** Load-more button text. Defaults to the catalog's "Load more". */
  loadMoreLabel?: string;
  /** Loading status text. Defaults to the catalog's "Loading…". */
  loadingLabel?: string;
  /** The active sort (controllable mirror). Defaults to the first sortable column. */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  /** Hidden column keys (controllable mirror). */
  hiddenColumns?: string[];
  onHiddenColumnsChange?: (hidden: string[]) => void;
  /** The body layout (controllable mirror). Defaults to `table`. */
  view?: "table" | "card";
  /** Show the table and cards switch. */
  allowViewToggle?: boolean;
  /** Show the column-visibility settings. */
  configurable?: boolean;
  /** Column-visibility settings label. Defaults to the catalog's "Columns". */
  configLabel?: string;
  /** Card view: the column shown as each card's title. Defaults to the first column. */
  cardTitleKey?: string;
  /** Card view: the column shown as each card's description. */
  cardDescriptionKey?: string;
  getValue?: (row: TableRow, key: string) => unknown;
  getRowId?: (row: TableRow, index: number) => string | number;
  /** Row selection: off by default. `single` or `multiple` adds the column. */
  selectionMode?: SelectionMode;
  /** The selected row ids (controlled). Replace the array; do not mutate it. */
  selectedRowIds?: RowId[];
  /** Called with the next ids after a user selection action. */
  onSelectedRowIdsChange?: (ids: RowId[]) => void;
  /** Marks rows the user may select. Others render without a checkbox. */
  isRowSelectable?: (row: TableRow) => boolean;
  /**
   * Names a row for its selection checkbox ("Select {name}"). Optional in the
   * type, but required at runtime whenever selection is active.
   */
  getRowLabel?: (row: TableRow) => string;
  /** Whether the consumer's filters are active. Filtering itself stays outside. */
  filtersActive?: boolean;
  /** Total unfiltered row count when known; `0` means the dataset is empty. */
  totalRowCount?: number;
  /** Changing this (or `filtersActive`) resets the local page to one. */
  filterRevision?: string | number;
  /** Clears the consumer's filters; enables the built-in no-results action. */
  onClearFilters?: () => void;
  /** Copy for the no-results state. Defaults to the catalog's message. */
  noResultsLabel?: string;
  /** Custom cell content, in the table and in the cards. Defaults to the cell value, as text. */
  renderCell?: (context: TableCellContext) => ReactNode;
}

const EMPTY: never[] = [];

// The requested id is honoured only while it exists in the views; anything
// else resolves to the first available view, so the tabs and the panels agree.
const resolveViewId = (requested: string | undefined, views: TableViewDef[]): string =>
  views.some((view) => view.id === requested) ? (requested as string) : (views[0]?.id ?? "");

/**
 * TableSet: the composed data-table shell around the pure `Table`. It adds the
 * chrome and owns the per-view state (sorting, column visibility, selection,
 * the page):
 *
 * - a header with an optional `title` and a `toolbar`;
 * - optional **tabs** that switch between several distinct views (`views`),
 *   each with its own columns and rows: selecting a tab swaps the whole table;
 * - per view: a table and cards switch, a column-visibility menu, the body (a
 *   `Table` or a list of `Card`s), and pagination or infinite loading.
 *
 * Without `views`, it renders a single view from `columns` and `rows`. Cells
 * render `row[column.key]` as text, or `renderCell`'s content. Filtering stays
 * the application's: the set takes the rows already filtered and the signals
 * that tell an empty dataset from no results. Themed via `--ds-table-*`.
 */
export function TableSet({
  columns = EMPTY,
  rows = EMPTY,
  views,
  activeView,
  viewsLabel,
  onViewChange,
  title,
  titleLevel = 2,
  caption,
  toolbar,
  ...config
}: TableSetProps) {
  const { t } = useI18n();
  const viewList = views ?? EMPTY;
  const hasViews = viewList.length > 0;

  // The active id mirrors `activeView` without reporting, and an id that
  // disappears with the views falls back to the first remaining one, silently.
  const [selected, setSelected] = useState(() => resolveViewId(activeView, viewList));
  const [lastActiveView, setLastActiveView] = useState(activeView);
  if (activeView !== lastActiveView) {
    setLastActiveView(activeView);
    if (activeView !== undefined) setSelected(resolveViewId(activeView, viewList));
  }
  const activeId = resolveViewId(selected, viewList);
  if (hasViews && activeId !== selected) setSelected(activeId);

  const Heading = `h${titleLevel}` as const;

  const tabItems = useMemo(() => viewList.map((view) => ({ value: view.id })), [viewList]);
  const { api: tabs } = useTabs({
    items: tabItems,
    value: hasViews ? activeId : null,
    onValueChange: (id) => {
      setSelected(id);
      onViewChange?.(id);
    },
  });

  return (
    <section className="table-set">
      {toolbar || hasViews ? (
        <header className="table-set__header">
          {title && hasViews ? <Heading className="table-set__title">{title}</Heading> : null}
          {toolbar}
          {hasViews ? (
            <div
              {...tabs.rootProps}
              className="table-set__tabs"
              aria-label={viewsLabel ?? t("table.views")}
            >
              {viewList.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  className="table-set__tab"
                  {...tabs.getTabProps(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </div>
          ) : null}
        </header>
      ) : null}

      {hasViews ? (
        viewList.map((view) => (
          <div key={view.id} {...tabs.getPanelProps(view.id)}>
            {view.id === activeId ? (
              // Keyed on the view, so switching tabs remounts the body: each
              // view starts from its own default sort.
              <TableView
                key={view.id}
                columns={view.columns}
                rows={view.rows}
                caption={view.caption ?? view.label}
                {...config}
              />
            ) : null}
          </div>
        ))
      ) : (
        <TableView
          columns={columns}
          rows={rows}
          title={title}
          titleLevel={titleLevel}
          caption={caption}
          {...config}
        />
      )}
    </section>
  );
}
