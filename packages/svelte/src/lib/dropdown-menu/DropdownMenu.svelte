<script lang="ts">
  /**
   * DropdownMenu — the styled, batteries-included menu button (WAI-ARIA menu
   * button pattern). A trigger opens a `role="menu"` of action items; behaviour
   * and accessibility (open/close, arrow & Home/End navigation, typeahead,
   * focus moving into the menu and returning to the trigger, Escape/outside to
   * close) come from the headless menu (`@design-system/core`). Popup
   * positioning (flip/shift, stays attached on scroll) is handled via
   * `@floating-ui/dom`.
   *
   * Pass `items` ({ value, label?, disabled? }) and an accessible `label` for
   * the trigger; `onSelect(value)` runs when an item is chosen. Colors, radius
   * and elevation are themeable CSS custom properties (`--ds-menu-*`).
   */
  import { createDropdownMenu, type MenuItem } from "./create-dropdown-menu";
  import Icon from "../icon/Icon.svelte";

  export let label: string;
  export let items: MenuItem[];
  export let disabled = false;
  /** Called with the chosen item's value. */
  export let onSelect: ((value: string) => void) | undefined = undefined;

  const menu = createDropdownMenu({ items, disabled, onSelect });
  const { triggerAction, menuAction, itemAction } = menu;
</script>

<div class="menu">
  <button class="menu__trigger" type="button" use:triggerAction>
    <span>{label}</span>
    <span class="menu__chevron" aria-hidden="true">
      <Icon size="100%"><polyline points="6 9 12 15 18 9" /></Icon>
    </span>
  </button>

  <div class="menu__popup" use:menuAction>
    {#each items as item (item.value)}
      <button class="menu__item" type="button" use:itemAction={item.value}>
        {item.label ?? item.value}
      </button>
    {/each}
  </div>
</div>

<style>
  .menu {
    display: inline-block;
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }

  .menu__trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: var(--ds-menu-trigger-padding, 0.5rem 0.75rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-menu-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    color: inherit;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .menu__trigger:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #2563eb);
    box-shadow: 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-focus-ring, #2563eb);
  }
  .menu__trigger:global([data-disabled]) {
    background: var(--ds-color-disabled, #e2e8f0);
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }
  .menu__chevron {
    display: inline-flex;
    inline-size: 1.1em;
    block-size: 1.1em;
    color: var(--ds-color-text-secondary, #64748b);
    transition: rotate 150ms ease;
  }
  .menu__trigger:global([data-state="open"]) .menu__chevron {
    rotate: 180deg;
  }

  .menu__popup {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--ds-menu-z-index, 50);
    min-inline-size: var(--ds-menu-min-width, 12rem);
    margin: 0;
    padding: var(--ds-menu-padding, 0.25rem);
    display: flex;
    flex-direction: column;
    background: var(--ds-color-background, #fff);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-menu-popup-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(--ds-elevation-overlay, 0 10px 15px -3px rgb(0 0 0 / 0.1));
  }
  .menu__popup:global([data-state="closed"]) {
    display: none;
  }

  .menu__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    inline-size: 100%;
    padding: 0.45rem 0.55rem;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  /* The active item is the one with DOM focus (roving) or pointer hover. */
  .menu__item:global([data-active]),
  .menu__item:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .menu__item:focus-visible {
    outline: none;
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .menu__item:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }
</style>
