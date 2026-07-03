<script lang="ts">
  /**
   * ToggleGroup — a styled group of toggle buttons (e.g. a text-formatting or
   * view switcher). Behaviour and accessibility (aria-pressed, roving tabindex,
   * arrow-key movement, single/multiple selection) come from the headless
   * toggle group (`@design-system/core`); this layer adds a segmented look.
   *
   * Each item provides a `label` (falling back to `value`). Colors, radius and
   * spacing are themeable via `--ds-toggle-group-*`.
   */
  import {
    createToggleGroup,
    type ToggleGroupItem,
    type ToggleGroupType,
  } from "./create-toggle-group";

  /** An item with an optional display label. */
  export type ToggleGroupEntry = ToggleGroupItem & { label?: string };

  export let items: ToggleGroupEntry[];
  export let value: string[] = [];
  /** `single` (default): at most one pressed. `multiple`: any number. */
  export let type: ToggleGroupType = "single";
  export let orientation: "horizontal" | "vertical" = "horizontal";
  export let disabled = false;
  /** Accessible name for the group. */
  export let label: string;
  /** Called whenever the pressed set changes. */
  export let onValueChange: ((value: string[]) => void) | undefined = undefined;

  const { rootAction, itemAction } = createToggleGroup({
    items,
    value,
    type,
    orientation,
    disabled,
    onValueChange,
  });
</script>

<div class="toggle-group" use:rootAction aria-label={label}>
  {#each items as item (item.value)}
    <button class="toggle-group__item" use:itemAction={item.value}>
      <slot name="item" {item}>{item.label ?? item.value}</slot>
    </button>
  {/each}
</div>

<style>
  .toggle-group {
    display: inline-flex;
    /* The group only wraps its items: it spaces them (gap) and itself
       (padding), but never sizes them — no cross-axis stretch. */
    align-items: flex-start;
    gap: var(--ds-toggle-group-gap, 0.375rem);
    padding: var(--ds-toggle-group-padding, 0);
    background: var(--ds-toggle-group-track, transparent);
    border-radius: var(--ds-toggle-group-radius, var(--ds-radius-control, 0.5rem));
  }
  .toggle-group:global([data-orientation="vertical"]) {
    flex-direction: column;
  }
  /* Each item is its own squared toggle button (mirrors the standalone
     ToggleButton): a 1px border at rest, a transparent fill, and — when on —
     a faint selection-colored fill + matching border. */
  .toggle-group__item {
    appearance: none;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    /* Equal, square size for every item (text or icon): the shared minimum is
       the only size driver — content is centered and its line box kept tight
       (line-height: 1) so tall glyphs can't inflate the height past it. */
    line-height: 1;
    min-block-size: var(--ds-control-height, 2.25rem);
    min-inline-size: var(--ds-control-height, 2.25rem);
    padding: var(--ds-toggle-group-item-padding, 0.35rem 0.7rem);
    border: 1px solid var(--ds-toggle-border, var(--ds-color-border, #cbd5e1));
    border-radius: var(--ds-toggle-group-item-radius, var(--ds-radius-control, 0.375rem));
    background: var(--ds-toggle-bg, var(--ds-color-background, #fff));
    color: var(--ds-color-text, #0f172a);
    cursor: pointer;
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      color 120ms ease;
  }
  /* Uniform icon size across items. */
  .toggle-group__item :global(svg) {
    inline-size: var(--ds-toggle-group-icon-size, 1.15rem);
    block-size: var(--ds-toggle-group-icon-size, 1.15rem);
  }
  .toggle-group__item:global([data-state="on"]) {
    /* No weight change on selection (it would shift width) — color + fill +
       border carry the state. */
    background: var(
      --ds-toggle-group-item-active,
      color-mix(in srgb, var(--ds-color-selected, #7b52cc) 10%, transparent)
    );
    color: var(--ds-color-selected, #7b52cc);
    border-color: color-mix(in srgb, var(--ds-color-selected, #7b52cc) 35%, transparent);
  }
  .toggle-group__item:global(:focus-visible) {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 1px;
  }
  .toggle-group__item:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
