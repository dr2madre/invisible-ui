<script lang="ts">
  /**
   * Menubar — a horizontal bar of menus (WAI-ARIA menubar pattern), like an
   * application menu (File / Edit / View). Each menu reuses the headless menu
   * (`@design-system/core`) for open/close, arrow & Home/End item navigation,
   * typeahead, focus moving into the menu and Escape/outside to close; this
   * component adds the menubar coordination: roving tabindex across the triggers,
   * ArrowLeft/Right to move between them (or switch the open menu), Home/End, and
   * hover-to-switch while a menu is open.
   *
   * Pass `menus` ({ value, label, items, disabled? }) and an accessible `label`
   * for the bar; `onSelect(menuValue, itemValue)` runs when an item is chosen.
   * Themeable via `--ds-menu-*` (shared with DropdownMenu) and `--ds-menubar-*`.
   */
  import { createMenubar, type MenubarMenu } from "./create-menubar";
  import { portal } from "../internal/portal";

  /** Accessible name for the menubar. */
  export let label: string;
  /** The top-level menus. */
  export let menus: MenubarMenu[];
  /** Called with the chosen item's menu value and item value. */
  export let onSelect: ((menuValue: string, itemValue: string) => void) | undefined = undefined;

  const menubar = createMenubar({ menus, onSelect });
  const { menubarAction, focusedIndex, menus: items } = menubar;
</script>

<div
  class="menubar"
  role="menubar"
  aria-label={label}
  aria-orientation="horizontal"
  use:menubarAction
>
  {#each items as menu, i (menu.value)}
    <div class="menubar__menu">
      <button
        class="menubar__trigger"
        type="button"
        role="menuitem"
        tabindex={i === $focusedIndex ? 0 : -1}
        use:menu.triggerAction
      >
        {menu.label}
      </button>

      <!-- Portalled out of the bar, so the bar's keydown (Arrow switching)
           must be attached here too. -->
      <div class="menubar__popup" use:portal use:menubarAction use:menu.menuAction>
        {#each menu.items as item (item.value)}
          <button class="menubar__item" type="button" use:menu.itemAction={item.value}>
            {item.label ?? item.value}
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .menubar {
    display: inline-flex;
    gap: var(--ds-menubar-gap, 0.125rem);
    padding: var(--ds-menubar-padding, 0.25rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-menubar-radius, var(--ds-radius-surface, 0.75rem));
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    font: inherit;
  }

  .menubar__menu {
    display: inline-block;
  }

  .menubar__trigger {
    display: inline-flex;
    align-items: center;
    padding: var(--ds-menubar-trigger-padding, 0.375rem 0.625rem);
    border: 0;
    border-radius: var(--ds-menu-radius, var(--ds-radius-control, 0.5rem));
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .menubar__trigger:hover,
  .menubar__trigger:global([data-state="open"]) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .menubar__trigger:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .menubar__trigger:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }

  .menubar__popup {
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
  .menubar__popup:global([data-state="closed"]) {
    display: none;
  }

  .menubar__item {
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
  .menubar__item:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .menubar__item:focus-visible {
    outline: none;
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .menubar__item:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }
</style>
