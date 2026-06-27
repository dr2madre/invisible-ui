<script context="module" lang="ts">
  let _uid = 0;
</script>

<script lang="ts">
  /**
   * SegmentedControl — the styled, batteries-included segmented control. A
   * single-select group built on **native** `<input type="radio">` items
   * sharing a `name`, laid out as a horizontal (or vertical) bar of segments.
   * The browser provides single selection, roving tabindex, arrow-key
   * navigation, focus and form participation.
   *
   * Items may carry an optional `label`; the `value` is used when omitted. The
   * control needs an accessible name via `label`. Colors are themeable CSS
   * custom properties (`--ds-segment-*`).
   */
  import type { ComponentType } from "svelte";
  import { createSegmentedControl, type SegmentItem } from "./create-segmented-control";

  /**
   * A segment, with an optional display `label` (falls back to `value`) and an
   * optional `icon` (any Svelte component, e.g. a lucide-svelte icon or a custom
   * `<Icon>` wrapper).
   */
  export type SegmentedControlItem = SegmentItem & {
    label?: string;
    icon?: ComponentType;
  };

  export let items: SegmentedControlItem[];
  export let value: string | null = null;
  export let disabled = false;
  /**
   * Layout and arrow-key axis. `horizontal` (default) is a segment bar;
   * `vertical` stacks the segments into a column (e.g. a sidebar). Each segment's
   * content stays a row (icon beside label) unless `stacked` is also set.
   */
  export let orientation: "horizontal" | "vertical" = "horizontal";
  /**
   * Render only the icon for each segment, hiding the visible label (the label
   * still names the segment via `aria-label`). Items without an icon keep their
   * text. Defaults to `false`.
   */
  export let iconOnly = false;
  /**
   * Stack each segment's content vertically — icon on top, label below (e.g. an
   * iOS-style tab). Implies the label stays visible. Defaults to `false`.
   */
  export let stacked = false;
  /** Accessible name for the control (announced by screen readers). */
  export let label: string;
  /** Visually hide the label (kept for assistive tech). Defaults to `false`. */
  export let hideLabel = false;
  /** Form field name — the selected value is submitted under it. */
  export let name: string | undefined = undefined;
  /** Called whenever the selected value changes. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const {
    state: segmentState,
    setValue,
    name: groupName,
  } = createSegmentedControl({ items, value, disabled, orientation, name, onValueChange });

  const labelId = `ds-segmented-${++_uid}`;
</script>

<div class="segmented-field">
  <span class="segmented-field__label" class:segmented-field__label--hidden={hideLabel} id={labelId}
    >{label}</span
  >
  <div
    class="segmented"
    class:segmented--vertical={orientation === "vertical"}
    role="radiogroup"
    aria-labelledby={labelId}
    aria-orientation={orientation}
    data-orientation={orientation}
  >
    {#each items as item (item.value)}
      {@const showLabel = stacked || !iconOnly || !item.icon}
      <label
        class="segment"
        class:segment--icon-only={iconOnly && item.icon && !stacked}
        class:segment--stacked={stacked}
        class:segment--disabled={disabled || item.disabled}
      >
        <input
          class="segment__input"
          type="radio"
          name={groupName}
          value={item.value}
          checked={$segmentState.value === item.value}
          disabled={disabled || item.disabled}
          aria-label={showLabel ? undefined : (item.label ?? item.value)}
          on:change={() => setValue(item.value)}
          data-state={$segmentState.value === item.value ? "checked" : "unchecked"}
        />
        {#if item.icon}
          <span class="segment__icon" aria-hidden="true">
            <svelte:component this={item.icon} />
          </span>
        {/if}
        {#if showLabel}
          <span class="segment__label">{item.label ?? item.value}</span>
        {/if}
      </label>
    {/each}
  </div>
</div>

<style>
  .segmented-field {
    display: inline-grid;
    gap: var(--ds-segment-label-gap, 0.375rem);
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .segmented-field__label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .segmented-field__label--hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .segmented {
    display: inline-flex;
    justify-self: start;
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-segment-radius, var(--ds-radius-control, 0.375rem));
    overflow: hidden;
  }
  /* Vertical: stack the segments into a column (e.g. a sidebar). */
  .segmented--vertical {
    flex-direction: column;
    align-self: start;
  }
  .segmented--vertical .segment {
    justify-content: flex-start;
    border-inline-start: none;
    border-block-start: 1px solid var(--ds-color-border, #cbd5e1);
  }
  .segmented--vertical .segment:first-child {
    border-block-start: none;
  }
  .segment {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ds-segment-gap, 0.4rem);
    padding: var(--ds-segment-padding, 0.4rem 0.9rem);
    cursor: pointer;
    border-inline-start: 1px solid var(--ds-color-border, #cbd5e1);
    transition:
      background-color 120ms ease,
      color 120ms ease;
  }
  .segment:first-child {
    border-inline-start: none;
  }
  /* Icon-only: square the padding for an even, compact target. */
  .segment--icon-only {
    padding: var(--ds-segment-icon-padding, 0.45rem);
  }
  /* Stacked: icon on top, label below (iOS-style tab). */
  .segment--stacked {
    flex-direction: column;
    gap: var(--ds-segment-stacked-gap, 0.25rem);
    padding: var(--ds-segment-stacked-padding, 0.5rem 0.9rem);
  }
  .segment--stacked .segment__label {
    font-size: var(--ds-segment-stacked-label-size, 0.75rem);
    line-height: 1.1;
  }
  .segment--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* The native radio is the accessible, focusable control; visually hidden, with
     the segment painted from its :checked / :focus-visible state via :has(). */
  .segment__input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .segment__icon {
    display: inline-flex;
    inline-size: var(--ds-segment-icon-size, 1.15em);
    block-size: var(--ds-segment-icon-size, 1.15em);
  }
  .segment__icon :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }
  .segment:has(.segment__input:checked) {
    background: var(--ds-color-secondary, #7b52cc);
    color: var(--ds-color-on-secondary, #fff);
  }
  .segment:has(.segment__input:focus-visible) {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: -2px;
  }
</style>
