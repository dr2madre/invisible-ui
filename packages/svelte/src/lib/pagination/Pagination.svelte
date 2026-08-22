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

  /**
   * Current page. Controllable mirror: clicking a page updates it locally and
   * reports through `onPageChange`; a later prop value overwrites the local
   * choice (clamped to `pageCount`) without a callback. The other props keep
   * their initial-value behaviour.
   */
  export let page = 1;
  export let pageCount: number;
  export let siblingCount = 1;
  export let boundaryCount = 1;
  export let disabled = false;
  /** Accessible name for the navigation landmark. Defaults to the i18n catalog's "Pagination". */
  export let label: string | undefined = undefined;
  /** Called whenever the page changes. */
  export let onPageChange: ((page: number) => void) | undefined = undefined;

  const { rootAction, prevAction, nextAction, pageAction, items, syncPage, syncConfig } =
    createPagination({
      page,
      pageCount,
      siblingCount,
      boundaryCount,
      disabled,
      // The arrow keeps the callback live: a handler swapped after mount is
      // the one that fires (ADR 0011), never the value captured at creation.
      onPageChange: (next) => onPageChange?.(next),
    });

  // Controlled sync: a later page prop follows without emitting onPageChange.
  $: syncPage(page);
  // Layout and availability follow their props the same silent way.
  $: syncConfig({ pageCount, siblingCount, boundaryCount, disabled });

  $: resolvedLabel = label ?? $t("pagination.label");
</script>

<nav class="pagination" use:rootAction aria-label={resolvedLabel}>
  <button class="pagination__control" use:prevAction aria-label={$t("pagination.previous")}
    >‹</button
  >
  {#each $items as item, i (typeof item === "number" ? `p${item}` : `e${i}`)}
    {#if item === "ellipsis"}
      <span class="pagination__ellipsis" aria-hidden="true">…</span>
    {:else}
      <button
        class="pagination__page"
        use:pageAction={item}
        aria-label={$t("pagination.page", { page: item })}
      >
        {item}
      </button>
    {/if}
  {/each}
  <button class="pagination__control" use:nextAction aria-label={$t("pagination.next")}>›</button>
</nav>

<style>
  .pagination {
    display: inline-flex;
    /* A long page list must not push the page wider on small screens. */
    flex-wrap: wrap;
    max-inline-size: 100%;
    align-items: center;
    gap: var(--ds-pagination-gap, 0.25rem);
  }
  .pagination__control,
  .pagination__page {
    appearance: none;
    min-inline-size: var(--ds-pagination-size, 2rem);
    block-size: var(--ds-pagination-size, 2rem);
    padding: 0 0.5rem;
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-pagination-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #282420);
    font: inherit;
    cursor: pointer;
  }
  .pagination__page:global([data-selected]) {
    background: var(--ds-pagination-active, var(--ds-color-secondary, #7a52cc));
    border-color: var(--ds-pagination-active, var(--ds-color-secondary, #7a52cc));
    color: var(--ds-pagination-active-text, var(--ds-color-on-emphasis, #f4f2ef));
    font-weight: 600;
  }
  .pagination__control:focus-visible,
  .pagination__page:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 1px;
  }
  .pagination__control:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .pagination__ellipsis {
    min-inline-size: 1.5rem;
    text-align: center;
    color: var(--ds-color-text-secondary, #524c44);
  }
</style>
