<script lang="ts" context="module">
  export interface BreadcrumbItem {
    /** Visible label. */
    label: string;
    /** Link target. Omit on the current (last) page. */
    href?: string;
    /** Render a home glyph before the label (typically the first item). */
    home?: boolean;
  }
</script>

<script lang="ts">
  /**
   * Breadcrumb — a navigation trail (`<nav><ol>`) from the site root to the
   * current page. Linked ancestors are underlined; the last item is the current
   * page (`aria-current="page"`, rendered in the selection color, not a link).
   *
   * Items are data-driven via `items`; mark the first with `home: true` for a
   * leading home glyph. Separators are decorative. Themeable via
   * `--ds-breadcrumb-*`.
   */
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  export let items: BreadcrumbItem[];
  /** Accessible name for the landmark. Defaults to the i18n catalog's "Breadcrumb". */
  export let label: string | undefined = undefined;
  /** Separator between items. Defaults to "/". */
  export let separator = "/";

  $: resolvedLabel = label ?? $t("breadcrumb.label");
</script>

<nav class="breadcrumb" aria-label={resolvedLabel}>
  <ol class="breadcrumb__list">
    {#each items as item, i (i)}
      {@const isLast = i === items.length - 1}
      <li class="breadcrumb__item">
        {#if i > 0}
          <span class="breadcrumb__sep" aria-hidden="true">{separator}</span>
        {/if}
        {#if isLast || !item.href}
          <span class="breadcrumb__current" aria-current={isLast ? "page" : undefined}>
            {#if item.home}
              <svg
                class="breadcrumb__home"
                viewBox="0 0 24 24"
                width="1em"
                height="1em"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            {/if}
            {item.label}
          </span>
        {:else}
          <a class="breadcrumb__link" href={item.href}>
            {#if item.home}
              <svg
                class="breadcrumb__home"
                viewBox="0 0 24 24"
                width="1em"
                height="1em"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span class="breadcrumb__sr">{item.label}</span>
            {:else}
              {item.label}
            {/if}
          </a>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .breadcrumb__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ds-breadcrumb-gap, 0.5rem);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--ds-breadcrumb-font-size, 0.875rem);
  }
  .breadcrumb__item {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-breadcrumb-gap, 0.5rem);
  }
  .breadcrumb__sep {
    color: var(--ds-breadcrumb-sep-text, var(--ds-color-text-secondary, #78716c));
  }
  .breadcrumb__link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--ds-breadcrumb-link-text, var(--ds-color-selected, #7b52cc));
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .breadcrumb__link:hover {
    color: var(--ds-breadcrumb-link-hover, var(--ds-color-secondary-hover, #6d28d9));
  }
  .breadcrumb__link:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #7b52cc));
    border-radius: var(--ds-radius-control, 0.25rem);
  }
  /* The current page: a dark grey (not black, not the link color), no link. */
  .breadcrumb__current {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--ds-breadcrumb-current-text, var(--ds-color-text-secondary, #57534e));
    font-weight: 600;
  }
  .breadcrumb__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
