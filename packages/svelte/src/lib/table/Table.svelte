<script module lang="ts">
  import type { SortState } from "./create-table";

  /** A table column definition (display + sorting). */
  export interface TableColumnDef {
    /** Stable key; the default accessor into a row. */
    key: string;
    /** Header label. */
    header: string;
    /** Whether the column can be sorted. */
    sortable?: boolean;
    /** Whether the column can be hidden via configuration (used by TableSet). */
    hideable?: boolean;
    /** Text alignment for the column's cells/header. Defaults to `start`. */
    align?: "start" | "center" | "end";
  }

  /** A row is any record; cells read `row[column.key]` by default. */
  export type TableRow = Record<string, unknown>;
  // eslint-disable-next-line no-import-assign -- false positive: TS type re-export
  export type { SortState };
</script>

<script lang="ts">
  /**
   * Table — just the grid: a styled, accessible `<table>` that renders the
   * `columns` and `rows` it is given. It is **controlled** — it does not sort,
   * paginate, or hide columns itself; it reflects the `sort` prop on its headers
   * (`aria-sort`) and emits `onSortToggle(key)` when a sortable header is
   * activated. Compose it inside `TableSet` for header/config/pagination, or pass
   * already-prepared `columns`/`rows` directly.
   *
   * Cells render `row[column.key]` by default; use the `cell` slot
   * (`let:row let:column let:value let:rowIndex`) for custom content. Provide a
   * `caption` to name the table for assistive tech. Themed via `--ds-table-*`.
   */
  export let columns: TableColumnDef[];
  export let rows: TableRow[];
  /** The active sort, reflected on the headers (controlled). */
  export let sort: SortState | null = null;
  /** Called with the column key when a sortable header is activated. */
  export let onSortToggle: ((key: string) => void) | undefined = undefined;
  /** Accessible name for the table (rendered as a `<caption>`). */
  export let caption: string | undefined = undefined;
  /** Visually hide the caption (still available to assistive tech). */
  export let hideCaption = false;
  /** Reads a row's value for a column (defaults to `row[key]`). */
  export let getValue: (row: TableRow, key: string) => unknown = (row, key) => row[key];
  /** Stable row key (defaults to `row.id`, falling back to the index). */
  export let getRowId: (row: TableRow, index: number) => string | number = (row, index) =>
    (row.id as string | number) ?? index;

  import Icon from "../icon/Icon.svelte";

  const ariaSort = (key: string): "ascending" | "descending" | "none" =>
    sort?.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none";
</script>

<table class="table">
  {#if caption}
    <caption class="table__caption" class:table__caption--hidden={hideCaption}>{caption}</caption>
  {/if}
  <thead class="table__head">
    <tr>
      {#each columns as column (column.key)}
        <th
          class="table__th"
          scope="col"
          data-align={column.align ?? "start"}
          data-sort-direction={column.sortable && sort?.key === column.key
            ? sort.direction
            : undefined}
          aria-sort={column.sortable ? ariaSort(column.key) : undefined}
        >
          {#if column.sortable}
            <button type="button" class="table__sort" on:click={() => onSortToggle?.(column.key)}>
              <span>{column.header}</span>
              <span class="table__sort-icon" aria-hidden="true">
                {#if sort?.key === column.key && sort.direction === "asc"}
                  <Icon size="0.9em"><polyline points="6 14 12 8 18 14" /></Icon>
                {:else if sort?.key === column.key}
                  <Icon size="0.9em"><polyline points="6 10 12 16 18 10" /></Icon>
                {:else}
                  <Icon size="0.9em" class="table__sort-icon-unset">
                    <polyline points="8 9 12 5 16 9" />
                    <polyline points="8 15 12 19 16 15" />
                  </Icon>
                {/if}
              </span>
            </button>
          {:else}
            {column.header}
          {/if}
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each rows as row, rowIndex (getRowId(row, rowIndex))}
      <tr class="table__row">
        {#each columns as column (column.key)}
          {@const value = getValue(row, column.key)}
          <td class="table__td" data-align={column.align ?? "start"}>
            <slot name="cell" {row} {column} {value} {rowIndex}>{value}</slot>
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .table {
    inline-size: 100%;
    border-collapse: collapse;
    font: inherit;
    color: var(--ds-color-text, #0f172a);
    font-size: var(--ds-table-font-size, 0.9375rem);
  }

  .table__caption {
    caption-side: top;
    text-align: start;
    padding-block-end: 0.5rem;
    font-weight: 600;
  }
  .table__caption--hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .table__th {
    text-align: start;
    font-weight: 600;
    /* Medium-dark header labels (not full black). */
    color: var(--ds-table-header-text, var(--ds-color-text-secondary, #57534e));
    /* Same height as body rows: identical padding + a 1px border (not thicker). */
    padding: var(--ds-table-cell-padding, 0.625rem 0.75rem);
    border-block-end: var(--ds-table-header-border, 1px) solid
      var(--ds-table-border, var(--ds-color-border, #e2e8f0));
    white-space: nowrap;
  }
  .table__td {
    padding: var(--ds-table-cell-padding, 0.625rem 0.75rem);
    border-block-end: 1px solid var(--ds-table-border, var(--ds-color-border, #e2e8f0));
  }
  .table__th[data-align="end"],
  .table__td[data-align="end"] {
    text-align: end;
  }
  .table__th[data-align="center"],
  .table__td[data-align="center"] {
    text-align: center;
  }

  .table__row:hover {
    background: var(--ds-table-row-hover, var(--ds-color-neutral-surface, #f8fafc));
  }

  .table__sort {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    font: inherit;
    font-weight: inherit;
    color: inherit;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .table__sort:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
    border-radius: 2px;
  }
  .table__sort-icon {
    display: inline-flex;
  }
  /* Unsorted columns show a faint up/down hint; the active one is emphasized. */
  .table__sort-icon :global(.table__sort-icon-unset) {
    opacity: 0.4;
  }
  .table__sort:hover .table__sort-icon :global(.table__sort-icon-unset) {
    opacity: 0.7;
  }
  /* The actively-sorted column reads as "selected": header label + icon adopt
     the selection color so the current sort is unmistakable. */
  .table__th[data-sort-direction] {
    color: var(--ds-table-sort-active, var(--ds-color-secondary, #7b52cc));
  }
  .table__th[data-sort-direction] .table__sort-icon {
    color: var(--ds-table-sort-active, var(--ds-color-secondary, #7b52cc));
  }
</style>
