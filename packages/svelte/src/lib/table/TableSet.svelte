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
   * - a header with an optional `title` and a `toolbar` slot;
   * - optional **tabs** that switch between several distinct views (`views`),
   *   each with its own columns + rows — selecting a tab swaps the whole table;
   * - per view: a table ↔ cards switcher, a column-visibility config dropdown,
   *   the body (a `Table` or a list of `Card`s), and pagination or infinite
   *   scroll in the footer.
   *
   * Without `views`, it renders a single view from `columns`/`rows`. Cells render
   * `row[column.key]` by default or via the `cell` slot
   * (`let:row let:column let:value let:rowIndex`). Themed via `--ds-table-*`.
   */
  import TableView from "./TableView.svelte";
  import { createTabs } from "../tabs/create-tabs";
  import type { RowId, SelectionMode, SortState } from "./create-table";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  // Single-view data (used when `views` is not provided).
  export let columns: TableColumnDef[] = [];
  export let rows: TableRow[] = [];
  /** Distinct views shown as tabs; each supplies its own columns + rows. */
  export let views: TableViewDef[] | undefined = undefined;
  /**
   * The active view id. Controllable mirror: selecting a tab updates it
   * locally and reports through `onViewChange`; a later prop value overwrites
   * the local choice without a callback. Defaults to the first view.
   */
  export let activeView: string | undefined = undefined;
  /** Accessible name for the views tab list. Defaults to the i18n catalog's "Views". */
  export let viewsLabel: string | undefined = undefined;
  /** Called when the active view changes. */
  export let onViewChange: ((id: string) => void) | undefined = undefined;

  /** Optional title shown in the header (rendered as a heading). */
  export let title: string | undefined = undefined;
  export let titleLevel: 2 | 3 | 4 | 5 | 6 = 2;
  /** Accessible name for the table/list (a `<caption>` in table view). */
  export let caption: string | undefined = undefined;
  export let hideCaption = false;

  // Per-view config, forwarded to the active TableView.
  export let pageSize: number | undefined = undefined;
  export let page = 1;
  /** Accessible name for the pagination nav. Defaults to the i18n catalog's "Table pages". */
  export let paginationLabel: string | undefined = undefined;
  export let onPageChange: ((page: number) => void) | undefined = undefined;
  export let infinite = false;
  export let hasMore = false;
  export let loading = false;
  export let onLoadMore: (() => void) | undefined = undefined;
  /** Load-more button text. Defaults to the i18n catalog's "Load more". */
  export let loadMoreLabel: string | undefined = undefined;
  /** Loading status text. Defaults to the i18n catalog's "Loading…". */
  export let loadingLabel: string | undefined = undefined;
  export let sort: SortState | null = null;
  export let onSortChange: ((sort: SortState | null) => void) | undefined = undefined;
  export let hiddenColumns: string[] = [];
  export let onHiddenColumnsChange: ((hidden: string[]) => void) | undefined = undefined;
  export let view: "table" | "card" = "table";
  export let allowViewToggle = false;
  export let configurable = false;
  /** Column-visibility dropdown label. Defaults to the i18n catalog's "Columns". */
  export let configLabel: string | undefined = undefined;
  export let cardTitleKey: string | undefined = undefined;
  export let cardDescriptionKey: string | undefined = undefined;
  export let getValue: (row: TableRow, key: string) => unknown = (row, key) => row[key];
  export let getRowId: (row: TableRow, index: number) => string | number = defaultGetRowId;

  /** Row selection: off by default. `single` or `multiple` adds the column. */
  export let selectionMode: SelectionMode = "none";
  /** The selected row ids (controlled). Replace the array; do not mutate it. */
  export let selectedRowIds: RowId[] = [];
  /** Called with the next ids after a user selection action. */
  export let onSelectedRowIdsChange: ((ids: RowId[]) => void) | undefined = undefined;
  /** Marks rows the user may select. Others render without a checkbox. */
  export let isRowSelectable: (row: TableRow) => boolean = () => true;
  /**
   * Names a row for its selection checkbox ("Select {name}"). Optional in the
   * type, but required at runtime whenever selection is active.
   */
  export let getRowLabel: ((row: TableRow) => string) | undefined = undefined;

  $: viewList = Array.isArray(views) ? views : [];
  $: hasViews = viewList.length > 0;

  // The requested id is honoured only while it exists in the views; anything
  // else resolves to the first available view. One source: activeId is always
  // a valid id (or empty with no views), so the tabs and the panels agree.
  const resolveViewId = (requested: string | undefined, list: TableViewDef[]) =>
    list.some((v) => v.id === requested) ? (requested as string) : (list[0]?.id ?? "");

  // A tab list drives which view is active. The tabs are created once and fed
  // through the sync helpers, so views can appear, change or disappear after
  // mount without a remount of the set.
  let activeId = resolveViewId(activeView, Array.isArray(views) ? views : []);
  const tabs = createTabs({
    items: (Array.isArray(views) ? views : []).map((v) => ({ value: v.id })),
    value: activeId,
    onValueChange: (id) => {
      activeId = id;
      onViewChange?.(id);
    },
  });
  const { rootAction, tabAction, panelAction, syncValue, setItems } = tabs;

  // Controllable mirrors, callback-free. The views array syncs on reference
  // change only: Svelte invalidates object props on every parent render, and
  // an unrelated rerender must not undo a local interaction. When the active
  // id disappears with the views, the first remaining view takes over without
  // onViewChange; with no views left, the single-view input renders instead.
  let lastViews = views;
  $: if (views !== lastViews) {
    lastViews = views;
    setItems(viewList.map((v) => ({ value: v.id })));
    if (hasViews && !viewList.some((v) => v.id === activeId)) {
      activeId = viewList[0]!.id;
    }
  }

  let lastActiveView = activeView;
  $: if (activeView !== lastActiveView) {
    lastActiveView = activeView;
    if (activeView !== undefined) activeId = resolveViewId(activeView, viewList);
  }

  // The tabs store follows the resolved active id, never the other way round.
  $: syncValue(hasViews ? activeId : null);

  // The per-view labels (pagination/loadMore/loading/config) are forwarded as-is:
  // when undefined, TableView falls back to the i18n catalog itself.
  $: resolvedViewsLabel = viewsLabel ?? $t("table.views");
</script>

<section class="table-set">
  {#if (title && hasViews) || $$slots.toolbar || hasViews}
    <header class="table-set__header">
      {#if title && hasViews}
        <svelte:element this={`h${titleLevel}`} class="table-set__title">{title}</svelte:element>
      {/if}
      <slot name="toolbar" />
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
            >
              <svelte:fragment slot="cell" let:row let:column let:value let:rowIndex>
                <slot name="cell" {row} {column} {value} {rowIndex}>{value}</slot>
              </svelte:fragment>
            </TableView>
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
    >
      <svelte:fragment slot="cell" let:row let:column let:value let:rowIndex>
        <slot name="cell" {row} {column} {value} {rowIndex}>{value}</slot>
      </svelte:fragment>
    </TableView>
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
    border-block-end: 1px solid var(--ds-color-border, #e2e8f0);
  }
  .table-set__tab {
    font: inherit;
    padding: 0.5rem 0.9rem;
    color: var(--ds-color-text-secondary, #64748b);
    background: none;
    border: 0;
    border-block-end: 2px solid transparent;
    margin-block-end: -1px;
    cursor: pointer;
  }
  .table-set__tab:hover {
    color: var(--ds-color-text, #0f172a);
  }
  .table-set__tab:global([data-state="active"]) {
    color: var(--ds-tabs-active, var(--ds-color-primary, #2563eb));
    border-block-end-color: var(--ds-tabs-active, var(--ds-color-primary, #2563eb));
    font-weight: 600;
  }
  .table-set__tab:global(:focus-visible) {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: -2px;
  }
</style>
