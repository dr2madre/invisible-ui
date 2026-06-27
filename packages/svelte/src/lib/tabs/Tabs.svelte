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

  /** A tab, with an optional display label and its panel text. */
  export type TabsItem = TabItem & { label?: string; content?: string };

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
      <button class="tabs__tab" use:tabAction={item.value}>{item.label ?? item.value}</button>
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
  .tabs__tab:global([data-state="active"]) {
    /* The selected tab is emphasized: bold + the primary underline. */
    font-weight: 700;
    color: var(--ds-color-secondary, #7b52cc);
    border-block-end-color: var(--ds-color-secondary, #7b52cc);
  }
  .tabs__tab:global(:focus-visible) {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
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
