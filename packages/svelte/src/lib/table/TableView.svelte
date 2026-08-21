<script lang="ts">
  /**
   * TableView — internal: the single-view body used by `TableSet`. Owns the
   * headless table state (sorting + column visibility) for one set of
   * `columns`/`rows` and renders a header row (optional title + a table↔cards
   * switcher + a column-settings button), the body inside a card (a `Table` or a
   * list of `Card`s), and — outside the card — the footer (pagination or
   * infinite-scroll). `TableSet` adds the tabs that swap between several views.
   * Not exported from the package.
   */
  import { tick } from "svelte";
  import type { Action } from "svelte/action";
  import Table, { defaultGetRowId, type TableColumnDef, type TableRow } from "./Table.svelte";
  import Pagination from "../pagination/Pagination.svelte";
  import SegmentedControl from "../segmented-control/SegmentedControl.svelte";
  import Popover from "../popover/Popover.svelte";
  import Checkbox from "../checkbox/Checkbox.svelte";
  import Card from "../card/Card.svelte";
  import EmptyState from "../empty-state/EmptyState.svelte";
  import Icon from "../icon/Icon.svelte";
  import {
    createTable,
    resolveSelectionIds,
    type RowId,
    type SelectionMode,
    type SortState,
    type TableContext,
  } from "./create-table";
  import { fail } from "../internal/dev";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  export let columns: TableColumnDef[];
  export let rows: TableRow[];
  export let caption: string | undefined = undefined;
  export let hideCaption = false;

  /** Optional title, rendered on the same row as the view controls. */
  export let title: string | undefined = undefined;
  export let titleLevel: 2 | 3 | 4 | 5 | 6 = 2;

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

  export let selectionMode: SelectionMode = "none";
  /** The selected row ids (controlled). Replace the array; do not mutate it. */
  export let selectedRowIds: RowId[] = [];
  export let onSelectedRowIdsChange: ((ids: RowId[]) => void) | undefined = undefined;
  /** Marks rows the user may select. Others render without a checkbox. */
  export let isRowSelectable: (row: TableRow) => boolean = () => true;
  /**
   * Names a row for its selection checkbox ("Select {name}"). Optional in the
   * type, but required at runtime whenever selection is active.
   */
  export let getRowLabel: ((row: TableRow) => string) | undefined = undefined;

  /** Whether the consumer's filters are active. Filtering itself stays outside. */
  export let filtersActive = false;
  /** Total unfiltered row count when known; `0` means the dataset is empty. */
  export let totalRowCount: number | undefined = undefined;
  /** Changing this (or `filtersActive`) resets the local page to one. */
  export let filterRevision: string | number | undefined = undefined;
  /** Clears the consumer's filters; enables the built-in no-results action. */
  export let onClearFilters: (() => void) | undefined = undefined;
  /** Copy for the no-results state. Defaults to the i18n catalog's message. */
  export let noResultsLabel: string | undefined = undefined;

  // There is always an active sort: default to the first sortable column.
  const defaultSort = (cols: TableColumnDef[]): SortState | null => {
    const firstSortable = cols.find((c) => c.sortable)?.key ?? null;
    return firstSortable ? { key: firstSortable, direction: "asc" } : null;
  };

  const context: TableContext = {
    columns,
    sort: sort ?? defaultSort(columns),
    hiddenColumns,
    selectionMode,
    selectedRowIds,
    // Arrow wrappers read the prop variables at call time, so replacing a
    // callback prop makes the next action call the new one, never a stale one.
    onSortChange: (next) => onSortChange?.(next),
    onHiddenColumnsChange: (next) => onHiddenColumnsChange?.(next),
    onSelectedRowIdsChange: (next) => onSelectedRowIdsChange?.(next),
  };
  const table = createTable(context);
  const {
    api,
    setSort,
    toggleColumnVisibility,
    syncSort,
    syncHiddenColumns,
    syncColumns,
    syncSelectedRowIds,
    syncSelectionMode,
  } = table;

  // Two-state toggle (asc ↔ desc): the table is never left unsorted.
  const toggleSort = (key: string) => {
    const current = $api.sort;
    if (current && current.key === key) {
      setSort({ key, direction: current.direction === "asc" ? "desc" : "asc" });
    } else {
      setSort({ key, direction: "asc" });
    }
  };

  // Controllable mirrors. Svelte invalidates object props on every parent
  // render, so each mirror fires only when the reference actually changed:
  // an unrelated rerender must not undo a local interaction. A sync never
  // calls the consumer's callback.
  let lastSort = sort;
  $: if (sort !== lastSort) {
    lastSort = sort;
    syncSort(sort ?? defaultSort(columns));
  }

  let lastHidden = hiddenColumns;
  $: if (hiddenColumns !== lastHidden) {
    lastHidden = hiddenColumns;
    syncHiddenColumns(hiddenColumns);
  }

  let lastSelected = selectedRowIds;
  $: if (selectedRowIds !== lastSelected) {
    lastSelected = selectedRowIds;
    syncSelectedRowIds(selectedRowIds);
  }

  // Changing the mode never touches the selection and never notifies.
  $: syncSelectionMode(selectionMode);

  // New columns keep the current sort while its key is still sortable;
  // otherwise the first sortable column takes over, without a callback.
  let lastColumns = columns;
  $: if (columns !== lastColumns) {
    lastColumns = columns;
    syncColumns(columns);
    const current = $api.sort;
    const stillSortable =
      current != null && columns.some((c) => c.key === current.key && c.sortable);
    if (!stillSortable) syncSort(defaultSort(columns));
  }

  $: resolvedPaginationLabel = paginationLabel ?? $t("table.pagination");
  $: resolvedLoadMoreLabel = loadMoreLabel ?? $t("table.loadMore");
  $: resolvedLoadingLabel = loadingLabel ?? $t("table.loading");
  $: resolvedConfigLabel = configLabel ?? $t("table.columns");
  $: resolvedNoResultsLabel = noResultsLabel ?? $t("table.noResults");

  $: titleKey = cardTitleKey ?? columns[0]?.key;

  let currentView = view;
  let currentPage = page;

  // Primitive mirrors: reflecting the prop never calls the callback, and an
  // unchanged prop value cannot undo a local interaction.
  $: currentView = view;
  let lastPage = page;
  $: if (page !== lastPage) {
    lastPage = page;
    currentPage = page;
  }

  const changePage = (next: number) => {
    currentPage = next;
    onPageChange?.(next);
  };

  // Filters own their values outside; this component only resets its page
  // when the filter signal or the explicit revision changes after mount.
  // The reset never touches the selection and notifies at most once; when
  // the page is already one, nothing is emitted. Sitting after the page
  // mirror, the reset wins inside one combined update, while a later page
  // prop still overwrites the mirror.
  let lastFiltersActive = filtersActive;
  let lastFilterRevision = filterRevision;
  $: if (filtersActive !== lastFiltersActive || !Object.is(filterRevision, lastFilterRevision)) {
    lastFiltersActive = filtersActive;
    lastFilterRevision = filterRevision;
    if (currentPage !== 1) {
      currentPage = 1;
      onPageChange?.(1);
    }
  }

  const viewItems = [
    { value: "table", label: "Table" },
    { value: "card", label: "Cards" },
  ];

  const sentinel: Action<HTMLElement> = (node) => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && hasMore && !loading) onLoadMore?.();
    });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  };

  $: paginated = !infinite && pageSize != null;
  $: shownColumns = columns.filter((c) => $api.isColumnVisible(c.key));
  $: sortedRows = $api.sortRows(rows, getValue);
  $: pageCount = paginated ? Math.max(1, Math.ceil(sortedRows.length / pageSize!)) : 1;
  // The component clamps once when the data shrinks under the current page,
  // and reports that page change through the existing callback exactly once.
  // The consumer's unchanged (now out-of-range) page prop is not reapplied by
  // unrelated rerenders; a later distinct page prop overwrites the mirror.
  $: if (currentPage > pageCount) {
    currentPage = pageCount;
    onPageChange?.(pageCount);
  }
  $: visibleRows = paginated
    ? sortedRows.slice((currentPage - 1) * pageSize!, currentPage * pageSize!)
    : sortedRows;

  // Zero rows means "no results" only while filters are active and the
  // dataset itself is not empty; an unknown total counts as not empty.
  $: noResults = rows.length === 0 && filtersActive && totalRowCount !== 0;

  // The built-in clear action unmounts with the panel, so focus would fall
  // to the body. When content returns after that action, the view root
  // takes focus instead.
  let rootEl: HTMLDivElement | null = null;
  let focusAfterClear = false;
  const clearFilters = () => {
    focusAfterClear = true;
    onClearFilters?.();
  };
  $: if (focusAfterClear && rows.length > 0) {
    focusAfterClear = false;
    void tick().then(() => rootEl?.focus());
  }

  $: selectionIds = resolveSelectionIds(rows, selectionMode, getRowId, defaultGetRowId);

  const selectionLabel = (row: TableRow, rowId: RowId): string => {
    const label = getRowLabel?.(row);
    if (label == null || label.trim() === "") {
      fail("Row selection needs `getRowLabel` returning a non-empty name for every row.");
      return String(rowId);
    }
    return label;
  };

  // Select-all only ever addresses the rendered slice.
  $: scopeIds =
    selectionMode === "multiple"
      ? visibleRows.flatMap((row) => {
          const id = selectionIds.get(row);
          return id != null && isRowSelectable(row) ? [id] : [];
        })
      : [];
  $: scopeState = selectionMode === "multiple" ? $api.getScopeSelectionState(scopeIds) : "none";
  $: selectAllChecked =
    scopeState === "all" ? true : scopeState === "some" ? ("indeterminate" as const) : false;

  // The fresh function identity on every selection change is the point:
  // it makes the child table re-evaluate its data-selected attributes.
  // eslint-disable-next-line svelte/no-reactive-functions
  $: isSelected = (row: TableRow) => {
    const id = selectionIds.get(row);
    return id != null && $api.isRowSelected(id);
  };
</script>

<div class="table-view" tabindex="-1" bind:this={rootEl}>
  {#if title || allowViewToggle || configurable}
    <header class="table-view__header">
      {#if title}
        <svelte:element this={`h${titleLevel}`} class="table-view__title">{title}</svelte:element>
      {/if}
      <div class="table-view__controls">
        {#if allowViewToggle}
          <SegmentedControl
            items={viewItems}
            value={currentView}
            label="View"
            hideLabel
            onValueChange={(v) => (currentView = v === "card" ? "card" : "table")}
          />
        {/if}
        {#if configurable}
          <Popover placement="bottom-end">
            <span slot="trigger" class="table-view__settings">
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
              <span class="table-view__sr">{resolvedConfigLabel}</span>
            </span>
            <div class="table-view__config-list" role="group" aria-label={resolvedConfigLabel}>
              {#each columns as column (column.key)}
                <Checkbox
                  label={column.header}
                  checked={$api.isColumnVisible(column.key)}
                  disabled={column.hideable === false}
                  onCheckedChange={() => toggleColumnVisibility(column.key)}
                />
              {/each}
            </div>
          </Popover>
        {/if}
      </div>
    </header>
  {/if}

  {#if noResults}
    <div class="table-view__no-results">
      <EmptyState
        title={resolvedNoResultsLabel}
        actionLabel={onClearFilters ? $t("table.clearFilters") : undefined}
        onAction={onClearFilters ? clearFilters : undefined}
      />
    </div>
  {:else if currentView === "card"}
    {#if selectionMode === "multiple"}
      <div class="table-view__cards-select-all">
        <Checkbox
          label={$t("table.selectPage")}
          checked={selectAllChecked}
          disabled={scopeIds.length === 0}
          onCheckedChange={() => $api.toggleScopeSelection(scopeIds)}
        />
      </div>
    {/if}
    <div class="table-view__cards" role="list" aria-label={caption}>
      {#each visibleRows as row, rowIndex (getRowId(row, rowIndex))}
        {@const fieldColumns = shownColumns.filter(
          (c) => c.key !== titleKey && c.key !== cardDescriptionKey,
        )}
        {@const selectionRowId = selectionIds.get(row) ?? null}
        {@const selectable = selectionRowId != null && isRowSelectable(row)}
        <div
          role="listitem"
          class:table-view__card-item={selectable}
          data-selected={selectionRowId != null && $api.isRowSelected(selectionRowId)
            ? ""
            : undefined}
        >
          {#if selectable && selectionRowId != null}
            <Checkbox
              hideLabel
              label={$t("table.selectRow", { name: selectionLabel(row, selectionRowId) })}
              checked={$api.isRowSelected(selectionRowId)}
              onCheckedChange={() => $api.toggleRowSelection(selectionRowId)}
            />
          {/if}
          <Card
            title={titleKey != null ? String(getValue(row, titleKey)) : undefined}
            description={cardDescriptionKey != null
              ? String(getValue(row, cardDescriptionKey))
              : undefined}
          >
            <dl class="table-view__card-fields">
              {#each fieldColumns as column (column.key)}
                {@const value = getValue(row, column.key)}
                <div class="table-view__card-field">
                  <dt class="table-view__card-label">{column.header}</dt>
                  <dd class="table-view__card-value">
                    <slot name="cell" {row} {column} {value} {rowIndex}>{value}</slot>
                  </dd>
                </div>
              {/each}
            </dl>
          </Card>
        </div>
      {/each}
    </div>
  {:else}
    <div class="table-view__card">
      <Table
        columns={shownColumns}
        rows={visibleRows}
        sort={$api.sort}
        onSortToggle={toggleSort}
        {caption}
        hideCaption={hideCaption || !!title}
        {getValue}
        {getRowId}
        selectionColumn={selectionMode !== "none"}
        isRowSelected={selectionMode !== "none" ? isSelected : undefined}
      >
        <svelte:fragment slot="selectionHeader">
          {#if selectionMode === "multiple"}
            <Checkbox
              hideLabel
              label={$t("table.selectPage")}
              checked={selectAllChecked}
              disabled={scopeIds.length === 0}
              onCheckedChange={() => $api.toggleScopeSelection(scopeIds)}
            />
          {:else}
            <span class="table-view__sr">{$t("table.selection")}</span>
          {/if}
        </svelte:fragment>
        <svelte:fragment slot="selectionCell" let:row>
          {@const selectionRowId = selectionIds.get(row) ?? null}
          {#if selectionRowId != null && isRowSelectable(row)}
            <Checkbox
              hideLabel
              label={$t("table.selectRow", { name: selectionLabel(row, selectionRowId) })}
              checked={$api.isRowSelected(selectionRowId)}
              onCheckedChange={() => $api.toggleRowSelection(selectionRowId)}
            />
          {/if}
        </svelte:fragment>
        <svelte:fragment slot="cell" let:row let:column let:value let:rowIndex>
          <slot name="cell" {row} {column} {value} {rowIndex}>{value}</slot>
        </svelte:fragment>
      </Table>
    </div>
  {/if}

  {#if infinite}
    <div class="table-view__infinite">
      <p class="table-view__status" role="status" aria-live="polite">
        {loading ? resolvedLoadingLabel : ""}
      </p>
      {#if hasMore}
        <button
          type="button"
          class="table-view__load-more"
          on:click={() => onLoadMore?.()}
          disabled={loading}
        >
          {loading ? resolvedLoadingLabel : resolvedLoadMoreLabel}
        </button>
      {/if}
      <div class="table-view__sentinel" use:sentinel aria-hidden="true"></div>
    </div>
  {:else if paginated && pageCount > 1}
    <div class="table-view__pagination">
      {#key pageCount}
        <Pagination
          page={currentPage}
          {pageCount}
          label={resolvedPaginationLabel}
          onPageChange={changePage}
        />
      {/key}
    </div>
  {/if}
</div>

<style>
  .table-view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  /* The root takes focus only programmatically, after clearing filters. */
  .table-view:focus {
    outline: none;
  }
  .table-view__no-results {
    display: grid;
    justify-items: center;
    padding: 2rem 1rem;
    border: 1px solid var(--ds-table-border, var(--ds-color-border, #c7c1b7));
    border-radius: var(--ds-table-radius, var(--ds-radius-surface, 0.75rem));
  }
  .table-view__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .table-view__title {
    margin: 0;
    font-size: var(--ds-table-title-size, 1.5rem);
    font-weight: 600;
  }
  .table-view__controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-inline-start: auto;
  }
  /* The column-settings trigger: a ghost icon button (no boxed border at rest,
     just a hover surface) so it doesn't read as a separate framed element. */
  .table-view__settings {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2.25rem;
    block-size: 2.25rem;
    color: var(--ds-color-text-secondary, #524c44);
    border: 1px solid transparent;
    border-radius: var(--ds-radius-control, 0.5rem);
    background: transparent;
  }
  .table-view__settings:hover {
    color: var(--ds-color-text, #282420);
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .table-view__sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .table-view__config-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-inline-size: 10rem;
  }
  /* The table body sits in a bordered card; the footer (pagination) is outside. */
  .table-view__card {
    border: 1px solid var(--ds-table-border, var(--ds-color-border, #c7c1b7));
    border-radius: var(--ds-table-radius, var(--ds-radius-surface, 0.75rem));
    overflow: hidden;
  }
  .table-view__cards-select-all {
    display: grid;
    justify-content: start;
  }
  /* The list item holds the selection checkbox beside the card. */
  .table-view__card-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem;
    align-items: start;
  }
  /* A comfortable touch target around the small box (WCAG 2.5.8): the
     padding expands the clickable label, the margin cancels the layout
     shift, and nothing changes visually. */
  .table-view__card-item :global(.field) {
    padding: 0.35rem;
    margin: -0.35rem;
  }
  .table-view__cards {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fill, minmax(var(--ds-table-card-min, 16rem), 1fr));
  }
  .table-view__card-fields {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .table-view__card-field {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }
  .table-view__card-label {
    margin: 0;
    color: var(--ds-color-text-secondary, #524c44);
    font-size: 0.8125rem;
  }
  .table-view__card-value {
    margin: 0;
    font-weight: 500;
    text-align: end;
  }
  .table-view__pagination {
    display: flex;
    justify-content: flex-end;
  }
  .table-view__infinite {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .table-view__status {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--ds-color-text-secondary, #524c44);
    min-block-size: 1rem;
  }
  .table-view__load-more {
    font: inherit;
    padding: 0.45rem 1rem;
    color: var(--ds-color-text, #282420);
    background: var(--ds-color-surface, #e6e0d8);
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
  }
  .table-view__load-more:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .table-view__load-more:disabled {
    opacity: 0.6;
    cursor: progress;
  }
  .table-view__sentinel {
    inline-size: 100%;
    block-size: 1px;
  }
</style>
