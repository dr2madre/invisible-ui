<script lang="ts">
  /**
   * NavigationMenu — a site-navigation bar where some items reveal a panel of
   * links (Radix "Navigation Menu"). Plain items are ordinary links; panel items
   * are disclosures. Behaviour/ARIA (open value, `aria-expanded`/`aria-controls`,
   * Escape, ArrowDown) come from the headless navigation menu
   * (`@invisible-ui/core`); this adapter adds hover open/close (with switching),
   * Floating-UI positioning, outside-press dismissal and focus movement.
   *
   * The pointer resting on a trigger opens its panel while it stays; a click
   * keeps it open, also one the pointer opened, and a second click closes it.
   * Escape closes and returns focus to the trigger; a press outside closes
   * without moving focus. Activating a link closes the panel before the
   * browser follows it.
   *
   * Pass `items`: `{ value, label, href, current? }` for a link, or
   * `{ value, label, links: [{ label, href, description?, current? }] }` for a
   * panel. `current` marks the link to the page on screen
   * (`aria-current="page"`); the trigger of the panel holding it is styled as
   * current too, without being announced as the page. Themeable via
   * `--ds-navmenu-*`.
   */
  import { createNavigationMenu, type NavigationMenuItem } from "./create-navigation-menu";
  import { portal } from "../internal/portal";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { locale: i18nLocale, dir: i18nDir } = getI18n();

  interface Props {
    /** Accessible name for the navigation landmark. */
    label: string;
    items: NavigationMenuItem[];
    onValueChange?: (value: string | null) => void;
  }

  let { label, items, onValueChange }: Props = $props();

  // A live callback reference (ADR 0011).
  const nav = createNavigationMenu({ onValueChange: (next) => onValueChange?.(next) });
  const { triggerAction, contentAction, linkAction, value } = nav;
</script>

<nav class="navmenu" aria-label={label}>
  <ul class="navmenu__list">
    {#each items as item (item.value)}
      <li class="navmenu__item">
        {#if item.links}
          <button
            class="navmenu__trigger"
            type="button"
            use:triggerAction={{
              value: item.value,
              holdsCurrent: item.links.some((link) => link.current),
            }}
          >
            {item.label}
            <span class="navmenu__chevron" aria-hidden="true">
              <Icon size="100%"><polyline points="6 9 12 15 18 9" /></Icon>
            </span>
          </button>

          {#if $value === item.value}
            <div
              class="navmenu__content"
              lang={$i18nLocale}
              dir={$i18nDir}
              use:portal
              use:contentAction={item.value}
            >
              <ul class="navmenu__links">
                {#each item.links as link (link.href)}
                  <li>
                    <a
                      class="navmenu__link"
                      href={link.href}
                      aria-current={link.current ? "page" : undefined}
                      use:linkAction={{ current: link.current, panel: item.value }}
                    >
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
          <!-- aria-current is written here too, so the server markup already
               names the current page before the action runs. -->
          <a
            class="navmenu__toplink"
            href={item.href}
            aria-current={item.current ? "page" : undefined}
            use:linkAction={{ current: item.current }}>{item.label}</a
          >
        {/if}
      </li>
    {/each}
  </ul>
</nav>

<style>
  .navmenu {
    font: inherit;
    color: var(--ds-color-text, #272727);
  }
  .navmenu__list {
    display: flex;
    /* A crowded menu bar wraps to more rows instead of widening the page. */
    flex-wrap: wrap;
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
    color: var(--ds-color-text-secondary, #515151);
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
    background: var(--ds-popover-background, var(--ds-color-background, #fff));
    border: 1px solid var(--ds-color-border, #bdbdbd);
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
    color: var(--ds-color-text-secondary, #515151);
  }

  /* The current page: the link the app marks, and the trigger whose panel
     holds it. A bar marks it besides the colour, so the state never rests on
     colour alone: under the label at the top level, along the inline-start
     edge in a panel. The attribute comes from the action, so it is global. */
  .navmenu__trigger:global([data-current]),
  .navmenu__toplink:global([data-current]) {
    color: var(--ds-color-secondary-body-text, #7a52cc);
    text-decoration: underline 2px;
    text-underline-offset: 0.35em;
  }
  .navmenu__link:global([data-current]) {
    /* The bar takes its width from the padding, so the label does not move. */
    padding-inline-start: calc(0.625rem - 2px);
    border-inline-start: 2px solid var(--ds-color-secondary-body-text, #7a52cc);
    background: color-mix(in srgb, var(--ds-color-secondary, #7a52cc) 10%, transparent);
  }
  .navmenu__link:global([data-current]) .navmenu__link-label {
    color: var(--ds-color-secondary-body-text, #7a52cc);
  }
  .navmenu__link:global([data-current]):hover,
  .navmenu__link:global([data-current]):focus-visible {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
</style>
