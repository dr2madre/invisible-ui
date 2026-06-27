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
    gap: var(--ds-toggle-group-gap, 0.25rem);
    padding: var(--ds-toggle-group-padding, 0.25rem);
    background: var(--ds-toggle-group-track, transparent);
    border-radius: var(--ds-toggle-group-radius, var(--ds-radius-control, 0.5rem));
  }
  .toggle-group:global([data-orientation="vertical"]) {
    flex-direction: column;
  }
  .toggle-group__item {
    appearance: none;
    border: none;
    font: inherit;
    padding: var(--ds-toggle-group-item-padding, 0.35rem 0.7rem);
    border-radius: var(
      --ds-toggle-group-item-radius,
      calc(var(--ds-radius-control, 0.5rem) - 0.25rem)
    );
    background: transparent;
    color: var(--ds-color-text, #0f172a);
    cursor: pointer;
  }
  .toggle-group__item:global([data-state="on"]) {
    background: var(
      --ds-toggle-group-item-active,
      color-mix(in srgb, var(--ds-color-secondary, #7b52cc) 10%, transparent)
    );
    color: var(--ds-color-secondary, #7b52cc);
    font-weight: 600;
  }
  .toggle-group__item:global(:focus-visible) {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: 1px;
  }
  .toggle-group__item:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
