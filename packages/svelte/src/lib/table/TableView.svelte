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
  import type { Action } from "svelte/action";
  import Table, { type TableColumnDef, type TableRow } from "./Table.svelte";
  import Pagination from "../pagination/Pagination.svelte";
  import SegmentedControl from "../segmented-control/SegmentedControl.svelte";
  import Popover from "../popover/Popover.svelte";
  import Checkbox from "../checkbox/Checkbox.svelte";
  import Card from "../card/Card.svelte";
  import Icon from "../icon/Icon.svelte";
  import { createTable, type SortState, type TableContext } from "./create-table";

  export let columns: TableColumnDef[];
  export let rows: TableRow[];
  export let caption: string | undefined = undefined;
  export let hideCaption = false;

  /** Optional title, rendered on the same row as the view controls. */
  export let title: string | undefined = undefined;
  export let titleLevel: 2 | 3 | 4 | 5 | 6 = 2;

  export let pageSize: number | undefined = undefined;
  export let page = 1;
  export let paginationLabel = "Table pages";
  export let onPageChange: ((page: number) => void) | undefined = undefined;

  export let infinite = false;
  export let hasMore = false;
  export let loading = false;
  export let onLoadMore: (() => void) | undefined = undefined;
  export let loadMoreLabel = "Load more";
  export let loadingLabel = "Loading…";

  export let sort: SortState | null = null;
  export let onSortChange: ((sort: SortState | null) => void) | undefined = undefined;
  export let hiddenColumns: string[] = [];
  export let onHiddenColumnsChange: ((hidden: string[]) => void) | undefined = undefined;

  export let view: "table" | "card" = "table";
  export let allowViewToggle = false;
  export let configurable = false;
  export let configLabel = "Columns";
  export let cardTitleKey: string | undefined = undefined;
  export let cardDescriptionKey: string | undefined = undefined;

  export let getValue: (row: TableRow, key: string) => unknown = (row, key) => row[key];
  export let getRowId: (row: TableRow, index: number) => string | number = (row, index) =>
    (row.id as string | number) ?? index;

  // There is always an active sort: default to the first sortable column.
  const firstSortable = columns.find((c) => c.sortable)?.key ?? null;
  const initialSort: SortState | null =
    sort ?? (firstSortable ? { key: firstSortable, direction: "asc" } : null);

  const context: TableContext = {
    columns,
    sort: initialSort,
    hiddenColumns,
    onSortChange,
    onHiddenColumnsChange,
  };
  const table = createTable(context);
  const { api, setSort, toggleColumnVisibility } = table;

  // Two-state toggle (asc ↔ desc): the table is never left unsorted.
  const toggleSort = (key: string) => {
    const current = $api.sort;
    if (current && current.key === key) {
      setSort({ key, direction: current.direction === "asc" ? "desc" : "asc" });
    } else {
      setSort({ key, direction: "asc" });
    }
  };

  $: titleKey = cardTitleKey ?? columns[0]?.key;

  let currentView = view;
  let currentPage = page;

  const changePage = (next: number) => {
    currentPage = next;
    onPageChange?.(next);
  };

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
  $: if (currentPage > pageCount) currentPage = pageCount;
  $: visibleRows = paginated
    ? sortedRows.slice((currentPage - 1) * pageSize!, currentPage * pageSize!)
    : sortedRows;
</script>

<div class="table-view">
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
              <span class="table-view__sr">{configLabel}</span>
            </span>
            <div class="table-view__config-list" role="group" aria-label={configLabel}>
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

  {#if currentView === "card"}
    <div class="table-view__cards" role="list" aria-label={caption}>
      {#each visibleRows as row, rowIndex (getRowId(row, rowIndex))}
        {@const fieldColumns = shownColumns.filter(
          (c) => c.key !== titleKey && c.key !== cardDescriptionKey,
        )}
        <div role="listitem">
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
        {hideCaption}
        {getValue}
        {getRowId}
      >
        <svelte:fragment slot="cell" let:row let:column let:value let:rowIndex>
          <slot name="cell" {row} {column} {value} {rowIndex}>{value}</slot>
        </svelte:fragment>
      </Table>
    </div>
  {/if}

  {#if infinite}
    <div class="table-view__infinite">
      <p class="table-view__status" role="status" aria-live="polite">
        {loading ? loadingLabel : ""}
      </p>
      {#if hasMore}
        <button
          type="button"
          class="table-view__load-more"
          on:click={() => onLoadMore?.()}
          disabled={loading}
        >
          {loading ? loadingLabel : loadMoreLabel}
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
          label={paginationLabel}
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
  .table-view__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .table-view__title {
    margin: 0;
    font-size: var(--ds-table-title-size, 1.25rem);
    font-weight: 600;
  }
  .table-view__controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-inline-start: auto;
  }
  /* The column-settings trigger, rendered as an icon button. */
  .table-view__settings {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2.25rem;
    block-size: 2.25rem;
    color: var(--ds-color-text-secondary, #64748b);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-radius-control, 0.5rem);
    background: var(--ds-color-background, #fff);
  }
  .table-view__settings:hover {
    color: var(--ds-color-text, #0f172a);
    background: var(--ds-color-neutral-surface, #f8fafc);
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
    border: 1px solid var(--ds-table-border, var(--ds-color-border, #e2e8f0));
    border-radius: var(--ds-table-radius, var(--ds-radius-surface, 0.75rem));
    overflow: hidden;
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
    color: var(--ds-color-text-secondary, #64748b);
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
    color: var(--ds-color-text-secondary, #64748b);
    min-block-size: 1rem;
  }
  .table-view__load-more {
    font: inherit;
    padding: 0.45rem 1rem;
    color: var(--ds-color-text, #0f172a);
    background: var(--ds-color-surface, #fff);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-radius-control, 0.375rem);
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
