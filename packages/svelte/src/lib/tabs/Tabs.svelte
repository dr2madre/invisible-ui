<script module lang="ts">
  import type { TabItem } from "./create-tabs";

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
</script>

<script lang="ts">
  /**
   * Tabs — the styled, batteries-included tabs widget (WAI-ARIA tabs pattern):
   * roving tabindex, arrow/Home/End navigation, automatic or manual activation.
   * Behaviour and accessibility come from the headless tabs (`@design-system/core`);
   * this layer adds the underline indicator and panels.
   *
   * Each item supplies a tab `label` (falling back to `value`) and, optionally,
   * its panel `content` as text. For rich panel markup, use the `panel`
   * snippet — it renders once per tab with `{ item }`, so the consumer can put
   * any content in the (correctly wired) panel and switch on `item.value`; the
   * text `content` is the fallback when the snippet is absent. Colors are
   * themeable CSS custom properties (`--ds-tabs-*`).
   */
  import { untrack, type Snippet } from "svelte";
  import { createTabs, type ActivationMode } from "./create-tabs";
  import Icon from "../icon/Icon.svelte";
  import { controllable } from "../internal/controllable.svelte";

  interface Props {
    items: TabsItem[];
    value?: string | null;
    activationMode?: ActivationMode;
    /** Accessible name for the tab list (announced by screen readers). */
    label: string;
    /** Called whenever the selected tab changes. */
    onValueChange?: (value: string) => void;
    /** Rich content of one panel, rendered once per tab with its `item`. */
    panel?: Snippet<[{ item: TabsItem }]>;
  }

  let {
    items,
    value = $bindable(null),
    activationMode = "automatic",
    label,
    onValueChange,
    panel,
  }: Props = $props();

  // The prop first, then the report (ADR 0011).
  const handleValueChange = (next: string) => {
    mirror.write(next);
    onValueChange?.(next);
  };

  // Seeded once from the first props; the mirror and the effects below follow
  // later ones.
  const { rootAction, tabAction, panelAction, syncValue, setItems, setActivationMode } = untrack(
    () =>
      createTabs({
        items,
        value,
        activationMode,
        onValueChange: handleValueChange,
      }),
  );

  // Controllable mirror (ADR 0011): a sync never reports a change.
  const mirror = controllable({
    get: () => value,
    set: (next) => (value = next),
    reflect: syncValue,
  });
  $effect.pre(() => {
    setItems(items);
  });
  $effect.pre(() => {
    setActivationMode(activationMode);
  });
</script>

<div class="tabs">
  <div class="tabs__list" use:rootAction aria-label={label}>
    {#each items as item (item.value)}
      <button
        class={["tabs__tab", item.iconOnly && "tabs__tab--icon-only"]}
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
    <div class="tabs__panel" use:panelAction={item.value}>
      <!-- Rich per-panel content via the snippet; falls back to the item's
           text `content` when no snippet is provided (backward compatible). -->
      {#if panel}{@render panel({ item })}{:else}{item.content ?? ""}{/if}
    </div>
  {/each}
</div>

<style>
  .tabs__list {
    display: inline-flex;
    gap: 0.25rem;
    /* A tab row that cannot fit scrolls inside itself; the tabs stay one
       row, and focusing a clipped tab scrolls it into view. */
    max-inline-size: 100%;
    overflow-x: auto;
    /* The rule is drawn inside the scroll area: a border would sit outside
       the clip, where the tabs' underline could never reach it. */
    box-shadow: inset 0 -1px 0 var(--ds-color-border, #c7c1b7);
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
    color: var(--ds-color-text, #282420);
    border-block-end: 2px solid transparent;
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
    color: var(--ds-color-text-secondary, #524c44);
    background: var(--ds-color-neutral-surface, #f4f2ef);
  }
  .tabs__tab:global([data-state="active"]) .tabs__tab-count {
    color: var(--ds-color-on-selected, var(--ds-color-on-secondary, #fff));
    background: var(--ds-color-selected, #7a52cc);
  }
  .tabs__tab:global([data-state="active"]) {
    /* Selected tab: the label stays the normal text color; only the underline
       carries the selection color (so the accent can change without recoloring
       the text). */
    font-weight: 700;
    color: var(--ds-color-text, #282420);
    border-block-end-color: var(--ds-color-selected, #7a52cc);
  }
  /* The list clips its children, so an outer ring would be cut off:
     the ring is drawn inside the tab instead. */
  .tabs__tab:global(:focus-visible) {
    outline: none;
    box-shadow: inset 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-focus-ring, #8e6cd4);
  }
  .tabs__tab:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .tabs__panel {
    padding-block: 0.75rem;
    color: var(--ds-color-text-secondary, #524c44);
  }
  /* Forced colors: the tab row is a scroller, so the ring must be drawn
     inside the tab or its top and bottom are clipped away. */
  @media (forced-colors: active) {
    .tabs__tab:global(:focus-visible) {
      outline-offset: -2px;
    }
  }
</style>
