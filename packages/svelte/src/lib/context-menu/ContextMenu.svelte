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
   * Wrap the target area in `children`; pass `items`
   * ({ value, label?, disabled? }) and `onSelect(value)`. Colors, radius and
   * elevation reuse the shared menu tokens (`--ds-menu-*`).
   */
  import { untrack, type Snippet } from "svelte";
  import { createContextMenu, type MenuItem } from "./create-context-menu";
  import { portal } from "../internal/portal";
  import { getI18n } from "../i18n/create-i18n";

  const { t, locale: i18nLocale, dir: i18nDir } = getI18n();

  interface Props {
    items: MenuItem[];
    disabled?: boolean;
    /** Called with the chosen item's value. */
    onSelect?: (value: string) => void;
    /** Accessible name for the menu popup (no labelling trigger exists). Defaults to the i18n catalog's "Context menu". */
    label?: string;
    /** The region the menu opens on. */
    children?: Snippet;
  }

  let { items, disabled = false, onSelect, label, children }: Props = $props();

  // Seeded once from the first props; the effects below follow later ones.
  // A live callback reference, so a swapped callback is honoured (ADR 0011).
  const menu = untrack(() =>
    createContextMenu({
      items,
      disabled,
      onSelect: (value) => onSelect?.(value),
    }),
  );
  const { open, triggerAction, menuAction, itemAction, syncItems, syncDisabled } = menu;

  // Items and disabled changed after mount reach the machine, so keyboard
  // navigation and typeahead follow what the template renders.
  $effect.pre(() => {
    syncItems(items);
  });
  $effect.pre(() => {
    syncDisabled(disabled);
  });

  const resolvedLabel = $derived(label ?? $t("contextMenu.label"));
</script>

<!-- triggerAction applies aria-haspopup="menu" at runtime; tabindex keeps the
     trigger reachable for the keyboard menu key. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="context-menu__trigger" tabindex="0" use:triggerAction>
  {@render children?.()}
</div>

<!-- Rendered only while open: the popup truly leaves the DOM (and the
     accessibility tree) when the menu is closed. -->
{#if $open}
  <div
    class="context-menu__popup"
    aria-label={resolvedLabel}
    lang={$i18nLocale}
    dir={$i18nDir}
    use:portal
    use:menuAction
  >
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
    color: var(--ds-color-text, #282420);
  }
  .context-menu__trigger:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
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
    border: 1px solid var(--ds-color-border, #c7c1b7);
    border-radius: var(--ds-menu-popup-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
    color: var(--ds-color-text, #282420);
    font: inherit;
  }

  .context-menu__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    inline-size: 100%;
    padding: 0.45rem 0.85rem;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  /* Hover (desktop) or keyboard focus only — no grey just for being the
     roving-active item on open (no grey on tap). */
  .context-menu__item:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  /* The tint alone is too faint to find (WCAG 2.4.7, 1.4.11): an inset ring
     marks the focused item. The menu clips, so the ring goes inside. */
  .context-menu__item:focus-visible {
    outline: none;
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
    box-shadow: inset 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-focus-ring, #8e6cd4);
  }
  .context-menu__item:global([data-disabled]) {
    color: var(--ds-color-text-disabled, #757067);
    cursor: not-allowed;
  }
</style>
