<script lang="ts">
  /**
   * NavigationMenu — a site-navigation bar where some items reveal a panel of
   * links (Radix "Navigation Menu"). Plain items are ordinary links; panel items
   * are disclosures. Behaviour/ARIA (open value, `aria-expanded`/`aria-controls`,
   * Escape, ArrowDown) come from the headless navigation menu
   * (`@design-system/core`); this adapter adds hover open/close (with switching),
   * Floating-UI positioning, outside-press dismissal and focus movement.
   *
   * Pass `items`: `{ value, label, href }` for a link, or
   * `{ value, label, links: [{ label, href, description? }] }` for a panel.
   * Themeable via `--ds-navmenu-*`.
   */
  import { createNavigationMenu, type NavigationMenuItem } from "./create-navigation-menu";
  import Icon from "../icon/Icon.svelte";

  /** Accessible name for the navigation landmark. */
  export let label: string;
  export let items: NavigationMenuItem[];
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;

  const nav = createNavigationMenu({ onValueChange });
  const { triggerAction, contentAction, value } = nav;
</script>

<nav class="navmenu" aria-label={label}>
  <ul class="navmenu__list">
    {#each items as item (item.value)}
      <li class="navmenu__item">
        {#if item.links}
          <button class="navmenu__trigger" type="button" use:triggerAction={item.value}>
            {item.label}
            <span class="navmenu__chevron" aria-hidden="true">
              <Icon size="100%"><polyline points="6 9 12 15 18 9" /></Icon>
            </span>
          </button>

          {#if $value === item.value}
            <div class="navmenu__content" use:contentAction={item.value}>
              <ul class="navmenu__links">
                {#each item.links as link (link.href)}
                  <li>
                    <a class="navmenu__link" href={link.href}>
                      <span class="navmenu__link-label">{link.label}</span>
                      {#if link.description}
                        <span class="navmenu__link-desc">{link.description}</span>
                      {/if}
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {:else}
          <a class="navmenu__toplink" href={item.href}>{item.label}</a>
        {/if}
      </li>
    {/each}
  </ul>
</nav>

<style>
  .navmenu {
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .navmenu__list {
    display: flex;
    gap: var(--ds-navmenu-gap, 0.25rem);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .navmenu__item {
    position: relative;
  }

  .navmenu__trigger,
  .navmenu__toplink {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: var(--ds-navmenu-trigger-padding, 0.5rem 0.75rem);
    border: 0;
    border-radius: var(--ds-navmenu-radius, var(--ds-radius-control, 0.5rem));
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }
  .navmenu__trigger:hover,
  .navmenu__toplink:hover,
  .navmenu__trigger:global([data-state="open"]) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .navmenu__trigger:focus-visible,
  .navmenu__toplink:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .navmenu__chevron {
    display: inline-flex;
    inline-size: 1em;
    block-size: 1em;
    color: var(--ds-color-text-secondary, #64748b);
    transition: rotate 150ms ease;
  }
  .navmenu__trigger:global([data-state="open"]) .navmenu__chevron {
    rotate: 180deg;
  }

  .navmenu__content {
    /* Positioned by the adapter (Floating UI) with a fixed strategy. */
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--ds-navmenu-z-index, 50);
    box-sizing: border-box;
    min-inline-size: var(--ds-navmenu-content-width, 18rem);
    padding: var(--ds-navmenu-content-padding, 0.5rem);
    background: var(--ds-color-background, #fff);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-navmenu-content-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }
  .navmenu__links {
    display: grid;
    gap: 0.125rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .navmenu__link {
    display: grid;
    gap: 0.125rem;
    padding: 0.5rem 0.625rem;
    border-radius: var(--ds-radius-control, 0.5rem);
    color: inherit;
    text-decoration: none;
  }
  .navmenu__link:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .navmenu__link:focus-visible {
    outline: none;
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .navmenu__link-label {
    font-weight: 600;
  }
  .navmenu__link-desc {
    font-size: 0.875rem;
    color: var(--ds-color-text-secondary, #64748b);
  }
</style>
