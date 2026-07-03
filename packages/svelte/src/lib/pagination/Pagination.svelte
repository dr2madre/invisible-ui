<script lang="ts">
  /**
   * Pagination — a styled pager: previous, the visible page numbers (with
   * ellipsis gaps) and next. Behaviour and accessibility (aria-current on the
   * current page, roving tabindex, arrow-key movement, disabled prev/next at
   * the bounds) come from the headless pagination (`@design-system/core`).
   *
   * Colors, sizing and radius are themeable via `--ds-pagination-*`.
   */
  import { createPagination } from "./create-pagination";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  export let page = 1;
  export let pageCount: number;
  export let siblingCount = 1;
  export let boundaryCount = 1;
  export let disabled = false;
  /** Accessible name for the navigation landmark. Defaults to the i18n catalog's "Pagination". */
  export let label: string | undefined = undefined;
  /** Called whenever the page changes. */
  export let onPageChange: ((page: number) => void) | undefined = undefined;

  const { rootAction, prevAction, nextAction, pageAction, items } = createPagination({
    page,
    pageCount,
    siblingCount,
    boundaryCount,
    disabled,
    onPageChange,
  });

  $: resolvedLabel = label ?? $t("pagination.label");
</script>

<nav class="pagination" use:rootAction aria-label={resolvedLabel}>
  <button class="pagination__control" use:prevAction aria-label="Go to previous page">‹</button>
  {#each $items as item, i (typeof item === "number" ? `p${item}` : `e${i}`)}
    {#if item === "ellipsis"}
      <span class="pagination__ellipsis" aria-hidden="true">…</span>
    {:else}
      <button class="pagination__page" use:pageAction={item} aria-label={`Go to page ${item}`}>
        {item}
      </button>
    {/if}
  {/each}
  <button class="pagination__control" use:nextAction aria-label="Go to next page">›</button>
</nav>

<style>
  .pagination {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-pagination-gap, 0.25rem);
  }
  .pagination__control,
  .pagination__page {
    appearance: none;
    min-inline-size: var(--ds-pagination-size, 2rem);
    block-size: var(--ds-pagination-size, 2rem);
    padding: 0 0.5rem;
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-pagination-radius, var(--ds-radius-control, 0.375rem));
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    font: inherit;
    cursor: pointer;
  }
  .pagination__page[data-selected] {
    background: var(--ds-pagination-active, var(--ds-color-secondary, #7b52cc));
    border-color: var(--ds-pagination-active, var(--ds-color-secondary, #7b52cc));
    color: var(--ds-pagination-active-text, var(--ds-color-on-emphasis, #fff));
    font-weight: 600;
  }
  .pagination__control:focus-visible,
  .pagination__page:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 1px;
  }
  .pagination__control[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .pagination__ellipsis {
    min-inline-size: 1.5rem;
    text-align: center;
    color: var(--ds-color-text-secondary, #64748b);
  }
</style>
