<script module lang="ts">
  import { defaultGetRowId, type TableColumnDef, type TableRow } from "./Table.svelte";

  /** A named table view (a tab): its own columns + rows. */
  export interface TableViewDef {
    /** Stable id (the tab value). */
    id: string;
    /** Tab label. */
    label: string;
    columns: TableColumnDef[];
    rows: TableRow[];
    /** Optional accessible name for this view's table/list (defaults to `label`). */
    caption?: string;
  }
</script>

<script lang="ts">
  /**
   * TableSet — the composed data-table shell around the pure `Table`. It adds the
   * chrome and owns the per-view state (sorting + column visibility, via the
   * internal `TableView`):
   *
   * - a header with an optional `title` and a `toolbar` snippet;
   * - optional **tabs** that switch between several distinct views (`views`),
   *   each with its own columns + rows — selecting a tab swaps the whole table;
   * - per view: a table ↔ cards switcher, a column-visibility config dropdown,
   *   the body (a `Table` or a list of `Card`s), and pagination or infinite
   *   scroll in the footer.
   *
   * Without `views`, it renders a single view from `columns`/`rows`. Cells render
   * `row[column.key]` by default or via the `cell` snippet
   * (`{ row, column, value, rowIndex }`). Themed via `--ds-table-*`.
   */
  import { untrack, type Snippet } from "svelte";
  import TableView from "./TableView.svelte";
  import { createTabs } from "../tabs/create-tabs";
  import type { RowId, SelectionMode, SortState } from "./create-table";
  import { getI18n } from "../i18n/create-i18n";
  import { controllable } from "../internal/controllable.svelte";

  const { t } = getI18n();

  interface Props {
    /** Single-view columns (used when `views` is not provided). */
    columns?: TableColumnDef[];
    /** Single-view rows (used when `views` is not provided). */
    rows?: TableRow[];
    /** Distinct views shown as tabs; each supplies its own columns + rows. */
    views?: TableViewDef[];
    /**
     * The active view id. Controllable mirror: selecting a tab updates it
     * locally and reports through `onViewChange`; a later prop value overwrites
     * the local choice without a callback. Defaults to the first view.
     */
    activeView?: string;
    /** Accessible name for the views tab list. Defaults to the i18n catalog's "Views". */
    viewsLabel?: string;
    /** Called when the active view changes. */
    onViewChange?: (id: string) => void;

    /** Optional title shown in the header (rendered as a heading). */
    title?: string;
    titleLevel?: 2 | 3 | 4 | 5 | 6;
    /** Accessible name for the table/list (a `<caption>` in table view). */
    caption?: string;
    hideCaption?: boolean;

    // Per-view config, forwarded to the active TableView.
    pageSize?: number;
    page?: number;
    /** Accessible name for the pagination nav. Defaults to the i18n catalog's "Table pages". */
    paginationLabel?: string;
    onPageChange?: (page: number) => void;
    infinite?: boolean;
    hasMore?: boolean;
    loading?: boolean;
    onLoadMore?: () => void;
    /** Load-more button text. Defaults to the i18n catalog's "Load more". */
    loadMoreLabel?: string;
    /** Loading status text. Defaults to the i18n catalog's "Loading…". */
    loadingLabel?: string;
    sort?: SortState | null;
    onSortChange?: (sort: SortState | null) => void;
    hiddenColumns?: string[];
    onHiddenColumnsChange?: (hidden: string[]) => void;
    view?: "table" | "card";
    allowViewToggle?: boolean;
    configurable?: boolean;
    /** Column-visibility dropdown label. Defaults to the i18n catalog's "Columns". */
    configLabel?: string;
    cardTitleKey?: string;
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
    /** Copy for the no-results state. Defaults to the i18n catalog's message. */
    noResultsLabel?: string;

    /** Header content beside the title, e.g. filters or actions. */
    toolbar?: Snippet;
    /** Custom cell content, in the table and in the cards. Defaults to the cell value. */
    cell?: Snippet<[{ row: TableRow; column: TableColumnDef; value: unknown; rowIndex: number }]>;
  }

  let {
    columns = [],
    rows = [],
    views,
    activeView = $bindable(),
    viewsLabel,
    onViewChange,
    title,
    titleLevel = 2,
    caption,
    hideCaption = false,
    pageSize,
    page = $bindable(1),
    paginationLabel,
    onPageChange,
    infinite = false,
    hasMore = false,
    loading = false,
    onLoadMore,
    loadMoreLabel,
    loadingLabel,
    sort = $bindable(null),
    onSortChange,
    hiddenColumns = $bindable([]),
    onHiddenColumnsChange,
    view = "table",
    allowViewToggle = false,
    configurable = false,
    configLabel,
    cardTitleKey,
    cardDescriptionKey,
    getValue = (row, key) => row[key],
    getRowId = defaultGetRowId,
    selectionMode = "none",
    selectedRowIds = $bindable([]),
    onSelectedRowIdsChange,
    isRowSelectable = () => true,
    getRowLabel,
    filtersActive = false,
    totalRowCount,
    filterRevision,
    onClearFilters,
    noResultsLabel,
    toolbar,
    cell,
  }: Props = $props();

  const viewList = $derived(Array.isArray(views) ? views : []);
  const hasViews = $derived(viewList.length > 0);

  // The requested id is honoured only while it exists in the views; anything
  // else resolves to the first available view. One source: activeId is always
  // a valid id (or empty with no views), so the tabs and the panels agree.
  const resolveViewId = (requested: string | undefined, list: TableViewDef[]) =>
    list.some((v) => v.id === requested) ? (requested as string) : (list[0]?.id ?? "");

  // A tab list drives which view is active. The tabs are created once and fed
  // through the sync helpers, so views can appear, change or disappear after
  // mount without a remount of the set. Seeded once from the first props; the
  // mirrors below follow later ones.
  let activeId = $state(
    untrack(() => resolveViewId(activeView, Array.isArray(views) ? views : [])),
  );
  const tabs = untrack(() =>
    createTabs({
      items: (Array.isArray(views) ? views : []).map((v) => ({ value: v.id })),
      value: activeId,
      onValueChange: (id) => {
        activeId = id;
        onViewChange?.(id);
      },
    }),
  );
  const { rootAction, tabAction, panelAction, syncValue, setItems } = tabs;

  // Controllable mirrors, callback-free. The views array syncs on reference
  // change only: an unrelated rerender must not undo a local interaction.
  // When the active id disappears with the views, the first remaining view
  // takes over without onViewChange; with no views left, the single-view
  // input renders instead.
  controllable({
    get: () => views,
    reflect: (next) => {
      const list = Array.isArray(next) ? next : [];
      setItems(list.map((v) => ({ value: v.id })));
      if (list.length > 0 && !list.some((v) => v.id === activeId)) {
        activeId = list[0]!.id;
      }
    },
  });

  controllable({
    get: () => activeView,
    reflect: (next) => {
      if (next !== undefined) activeId = resolveViewId(next, viewList);
    },
  });

  // The tabs store follows the resolved active id, never the other way round.
  $effect.pre(() => {
    syncValue(hasViews ? activeId : null);
  });

  // The per-view labels (pagination/loadMore/loading/config) are forwarded as-is:
  // when undefined, TableView falls back to the i18n catalog itself.
  const resolvedViewsLabel = $derived(viewsLabel ?? $t("table.views"));
</script>

<section class="table-set">
  {#if (title && hasViews) || toolbar || hasViews}
    <header class="table-set__header">
      {#if title && hasViews}
        <svelte:element this={`h${titleLevel}`} class="table-set__title">{title}</svelte:element>
      {/if}
      {@render toolbar?.()}
      {#if hasViews}
        <div class="table-set__tabs" use:rootAction aria-label={resolvedViewsLabel}>
          {#each viewList as v (v.id)}
            <button class="table-set__tab" use:tabAction={v.id}>{v.label}</button>
          {/each}
        </div>
      {/if}
    </header>
  {/if}

  {#if hasViews}
    {#each viewList as v (v.id)}
      <div use:panelAction={v.id}>
        {#if v.id === activeId}
          {#key activeId}
            <TableView
              columns={v.columns}
              rows={v.rows}
              caption={v.caption ?? v.label}
              {hideCaption}
              {pageSize}
              {page}
              {paginationLabel}
              {onPageChange}
              {infinite}
              {hasMore}
              {loading}
              {onLoadMore}
              {loadMoreLabel}
              {loadingLabel}
              {sort}
              {onSortChange}
              {hiddenColumns}
              {onHiddenColumnsChange}
              {view}
              {allowViewToggle}
              {configurable}
              {configLabel}
              {cardTitleKey}
              {cardDescriptionKey}
              {getValue}
              {getRowId}
              {selectionMode}
              {selectedRowIds}
              {onSelectedRowIdsChange}
              {isRowSelectable}
              {getRowLabel}
              {filtersActive}
              {totalRowCount}
              {filterRevision}
              {onClearFilters}
              {noResultsLabel}
              {cell}
            />
          {/key}
        {/if}
      </div>
    {/each}
  {:else}
    <TableView
      {columns}
      {rows}
      {title}
      {titleLevel}
      {caption}
      {hideCaption}
      {pageSize}
      {page}
      {paginationLabel}
      {onPageChange}
      {infinite}
      {hasMore}
      {loading}
      {onLoadMore}
      {loadMoreLabel}
      {loadingLabel}
      {sort}
      {onSortChange}
      {hiddenColumns}
      {onHiddenColumnsChange}
      {view}
      {allowViewToggle}
      {configurable}
      {configLabel}
      {cardTitleKey}
      {cardDescriptionKey}
      {getValue}
      {getRowId}
      {selectionMode}
      {selectedRowIds}
      {onSelectedRowIdsChange}
      {isRowSelectable}
      {getRowLabel}
      {filtersActive}
      {totalRowCount}
      {filterRevision}
      {onClearFilters}
      {noResultsLabel}
      {cell}
    />
  {/if}
</section>

<style>
  .table-set {
    inline-size: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .table-set__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .table-set__title {
    margin: 0;
    font-size: var(--ds-table-title-size, 1.5rem);
    font-weight: 600;
  }

  .table-set__tabs {
    display: inline-flex;
    gap: 0.25rem;
    border-block-end: 1px solid var(--ds-color-border, #c7c1b7);
  }
  .table-set__tab {
    font: inherit;
    padding: 0.5rem 0.9rem;
    color: var(--ds-color-text-secondary, #524c44);
    background: none;
    border: 0;
    border-block-end: 2px solid transparent;
    margin-block-end: -1px;
    cursor: pointer;
  }
  .table-set__tab:hover {
    color: var(--ds-color-text, #282420);
  }
  .table-set__tab:global([data-state="active"]) {
    color: var(--ds-tabs-active, var(--ds-color-primary, #7a52cc));
    border-block-end-color: var(--ds-tabs-active, var(--ds-color-primary, #7a52cc));
    font-weight: 600;
  }
  .table-set__tab:global(:focus-visible) {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: -2px;
  }
</style>
