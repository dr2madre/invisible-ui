<script lang="ts">
  /**
   * Tabs — the styled, batteries-included tabs widget (WAI-ARIA tabs pattern):
   * roving tabindex, arrow/Home/End navigation, automatic or manual activation.
   * Behaviour and accessibility come from the headless tabs (`@design-system/core`);
   * this layer adds the underline indicator and panels.
   *
   * Each item supplies a tab `label` (falling back to `value`) and its panel
   * `content` as text. For rich panel markup, drive the headless `createTabs`
   * directly. Colors are themeable CSS custom properties (`--ds-tabs-*`).
   */
  import { createTabs, type ActivationMode, type TabItem } from "./create-tabs";
  import Icon from "../icon/Icon.svelte";

  /**
   * A tab, with an optional display label and its panel text. May also carry a
   * `count` (shown as a trailing badge — violet when the tab is selected, grey
   * otherwise), a leading `icon` (an SVG path `d` string), and `iconOnly` to
   * render just the icon (the label becomes the accessible name).
   */
  export type TabsItem = TabItem & {
    label?: string;
    content?: string;
    count?: number;
    icon?: string;
    iconOnly?: boolean;
  };

  export let items: TabsItem[];
  export let value: string | null = null;
  export let activationMode: ActivationMode = "automatic";
  /** Accessible name for the tab list (announced by screen readers). */
  export let label: string;
  /** Called whenever the selected tab changes. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const { rootAction, tabAction, panelAction } = createTabs({
    items,
    value,
    activationMode,
    onValueChange,
  });
</script>

<div class="tabs">
  <div class="tabs__list" use:rootAction aria-label={label}>
    {#each items as item (item.value)}
      <button
        class="tabs__tab"
        class:tabs__tab--icon-only={item.iconOnly}
        use:tabAction={item.value}
        aria-label={item.iconOnly ? (item.label ?? item.value) : undefined}
      >
        {#if item.icon}
          <span class="tabs__tab-icon" aria-hidden="true">
            <Icon size="100%"><path d={item.icon} /></Icon>
          </span>
        {/if}
        {#if !item.iconOnly}
          <span class="tabs__tab-label">{item.label ?? item.value}</span>
        {/if}
        {#if item.count != null}
          <span class="tabs__tab-count" aria-hidden="true">{item.count}</span>
        {/if}
      </button>
    {/each}
  </div>
  {#each items as item (item.value)}
    <div class="tabs__panel" use:panelAction={item.value}>{item.content ?? ""}</div>
  {/each}
</div>

<style>
  .tabs__list {
    display: inline-flex;
    gap: 0.25rem;
    border-block-end: 1px solid var(--ds-color-border, #cbd5e1);
  }
  .tabs__tab {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: var(--ds-tabs-tab-padding, 0.4rem 0.8rem);
    border: none;
    background: none;
    cursor: pointer;
    font: inherit;
    /* Idle tabs use full-strength text (not muted grey). */
    color: var(--ds-color-text, #0f172a);
    border-block-end: 2px solid transparent;
    margin-block-end: -1px;
    transition:
      color 120ms ease,
      border-color 120ms ease;
  }
  .tabs__tab-icon {
    display: inline-flex;
    inline-size: 1.1em;
    block-size: 1.1em;
    flex: none;
  }
  .tabs__tab--icon-only {
    padding-inline: 0.55rem;
  }
  /* Count badge: grey pill by default, violet when the tab is selected. */
  .tabs__tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 1.25rem;
    padding-inline: 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.4;
    border-radius: var(--ds-radius-pill, 999px);
    color: var(--ds-color-text-secondary, #64748b);
    background: var(--ds-color-neutral-surface, #f1f5f9);
  }
  .tabs__tab:global([data-state="active"]) .tabs__tab-count {
    color: var(--ds-color-on-selected, var(--ds-color-on-secondary, #fff));
    background: var(--ds-color-selected, #7b52cc);
  }
  .tabs__tab:global([data-state="active"]) {
    /* Selected tab: the label stays the normal text color; only the underline
       carries the selection color (so the accent can change without recoloring
       the text). */
    font-weight: 700;
    color: var(--ds-color-text, #1c1917);
    border-block-end-color: var(--ds-color-selected, #7b52cc);
  }
  .tabs__tab:global(:focus-visible) {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .tabs__tab:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .tabs__panel {
    padding-block: 0.75rem;
    color: var(--ds-color-text-secondary, #64748b);
  }
</style>
