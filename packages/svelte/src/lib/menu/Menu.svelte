<script lang="ts" context="module">
  export interface MenuItem {
    value: string;
    label: string;
    href?: string;
    /** Optional leading icon component (rendered as `<svelte:component>`). */
    icon?: unknown;
  }
  export interface MenuSection {
    /** Optional section heading. */
    label?: string;
    items: MenuItem[];
  }
</script>

<script lang="ts">
  /**
   * Menu — a sidebar navigation organism: a logo header, one or more labelled
   * sections of items (icon + label), and a footer slot. Items are links when
   * given an `href`, otherwise buttons that emit `onSelect`. The active item is
   * marked with `aria-current="page"` and the selection color.
   *
   * Composed for the desktop/tablet sidebar pattern; themeable via `--ds-menu-*`.
   */
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  export let sections: MenuSection[];
  /** The active item's value. */
  export let value: string | null = null;
  /** Accessible name for the navigation landmark. Defaults to the i18n catalog's "Main". */
  export let label: string | undefined = undefined;
  export let onSelect: ((value: string) => void) | undefined = undefined;

  $: resolvedLabel = label ?? $t("menu.label");
</script>

<nav class="menu" aria-label={resolvedLabel}>
  {#if $$slots.logo}
    <div class="menu__logo"><slot name="logo" /></div>
  {/if}

  {#each sections as section, s (s)}
    <div class="menu__section">
      {#if section.label}
        <p class="menu__section-label">{section.label}</p>
      {/if}
      <ul class="menu__list">
        {#each section.items as item (item.value)}
          {@const active = item.value === value}
          <li>
            {#if item.href}
              <a
                class="menu__item"
                class:menu__item--active={active}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                {#if item.icon}<span class="menu__icon"><svelte:component this={item.icon} /></span
                  >{/if}
                <span class="menu__label">{item.label}</span>
              </a>
            {:else}
              <button
                type="button"
                class="menu__item"
                class:menu__item--active={active}
                aria-current={active ? "page" : undefined}
                on:click={() => onSelect?.(item.value)}
              >
                {#if item.icon}<span class="menu__icon"><svelte:component this={item.icon} /></span
                  >{/if}
                <span class="menu__label">{item.label}</span>
              </button>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/each}

  {#if $$slots.footer}
    <div class="menu__footer"><slot name="footer" /></div>
  {/if}
</nav>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    gap: var(--ds-menu-gap, 0.75rem);
    inline-size: var(--ds-menu-width, 15rem);
    padding: var(--ds-menu-padding, 0.75rem);
    background: var(--ds-menu-bg, var(--ds-color-background, #fff));
    border: 1px solid var(--ds-menu-border, var(--ds-color-border, #e7e5e4));
    border-radius: var(--ds-menu-radius, var(--ds-radius-surface, 0.75rem));
  }
  .menu__logo {
    padding: 0.25rem 0.5rem;
  }
  .menu__section-label {
    margin: 0 0 0.25rem;
    padding-inline: 0.5rem;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ds-color-text-secondary, #78716c);
  }
  .menu__list {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .menu__item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    inline-size: 100%;
    padding: 0.5rem 0.625rem;
    font: inherit;
    text-align: start;
    color: var(--ds-menu-item-text, var(--ds-color-text, #1c1917));
    text-decoration: none;
    background: none;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
  }
  .menu__item:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .menu__item--active {
    color: var(--ds-color-secondary, #7b52cc);
    background: color-mix(in srgb, var(--ds-color-secondary, #7b52cc) 10%, transparent);
    font-weight: 600;
  }
  .menu__item:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #7b52cc));
  }
  .menu__icon {
    display: inline-flex;
    font-size: 1.1em;
  }
  .menu__footer {
    margin-block-start: auto;
    padding-block-start: 0.5rem;
    border-block-start: 1px solid var(--ds-color-border, #e7e5e4);
  }
</style>
