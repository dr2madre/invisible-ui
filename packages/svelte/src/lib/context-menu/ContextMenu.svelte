<script lang="ts">
  /**
   * ContextMenu — a styled menu summoned by right-click (or the keyboard menu
   * key) on a region, opening a `role="menu"` of action items at the pointer.
   * Behaviour and accessibility (open at pointer, arrow & Home/End navigation,
   * typeahead, roving focus, Enter/click activation, Escape / Tab / outside to
   * close, focus restored on close) come from the headless menu primitive
   * (`@design-system/core`). Popup positioning (flip/shift against a virtual
   * anchor at the pointer) uses `@floating-ui/dom`.
   *
   * Wrap the target area in the default slot; pass `items`
   * ({ value, label?, disabled? }) and `onSelect(value)`. Colors, radius and
   * elevation reuse the shared menu tokens (`--ds-menu-*`).
   */
  import { createContextMenu, type MenuItem } from "./create-context-menu";

  export let items: MenuItem[];
  export let disabled = false;
  /** Called with the chosen item's value. */
  export let onSelect: ((value: string) => void) | undefined = undefined;
  /** Accessible name for the menu popup (no labelling trigger exists). */
  export let label = "Context menu";

  const menu = createContextMenu({ items, disabled, onSelect });
  const { open, triggerAction, menuAction, itemAction } = menu;
</script>

<div class="context-menu__trigger" tabindex="0" use:triggerAction>
  <slot />
</div>

<!-- Rendered only while open: the popup truly leaves the DOM (and the
     accessibility tree) when the menu is closed. -->
{#if $open}
  <div class="context-menu__popup" aria-label={label} use:menuAction>
    {#each items as item (item.value)}
      <button class="context-menu__item" type="button" use:itemAction={item.value}>
        {item.label ?? item.value}
      </button>
    {/each}
  </div>
{/if}

<style>
  .context-menu__trigger {
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .context-menu__trigger:focus-visible {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, #2563eb);
    outline-offset: 2px;
    border-radius: var(--ds-radius-control, 0.5rem);
  }

  .context-menu__popup {
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
    color: var(--ds-color-text, #0f172a);
    font: inherit;
  }

  .context-menu__item {
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
  .context-menu__item:global([data-active]),
  .context-menu__item:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .context-menu__item:focus-visible {
    outline: none;
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .context-menu__item:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }
</style>
