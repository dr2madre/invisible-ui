<script lang="ts">
  /**
   * ToggleButton — the styled, batteries-included toggle button: a button that
   * is on or off (`aria-pressed`), for toolbars like text-formatting (Bold,
   * Italic). Behaviour and accessibility come from the headless toggle button
   * (`@design-system/core`).
   *
   * Distinct from a switch: use `Switch` for a settings-style on/off control.
   * The label comes from the default slot; provide an explicit `label` when the
   * slot is icon-only so the control still has an accessible name. Colors and
   * sizing are themeable CSS custom properties (`--ds-toggle-*`).
   */
  import { createToggleButton } from "./create-toggle-button";

  export let pressed = false;
  export let disabled = false;
  /** Accessible name; required when the slot content is icon-only. */
  export let label: string | undefined = undefined;
  /** Called whenever the pressed value changes. */
  export let onPressedChange: ((p: boolean) => void) | undefined = undefined;

  const { rootAction } = createToggleButton({ pressed, disabled, onPressedChange });
</script>

<button class="toggle" use:rootAction aria-label={label}>
  <slot />
</button>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-inline-size: var(--ds-toggle-size, 2.25rem);
    block-size: var(--ds-toggle-size, 2.25rem);
    padding: 0 var(--ds-toggle-padding-inline, 0.5rem);
    border: 1px solid var(--ds-toggle-border, var(--ds-color-border, #cbd5e1));
    border-radius: var(--ds-toggle-radius, var(--ds-radius-control, 0.375rem));
    background: var(--ds-toggle-bg, var(--ds-color-background, #fff));
    color: var(--ds-color-text, #0f172a);
    cursor: pointer;
    font: inherit;
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      color 120ms ease;
  }
  /* Hover defaults to the rest background (no change); a flat toolbar overrides
     it with a subtle state overlay for affordance. */
  .toggle:hover {
    background: var(--ds-toggle-bg-hover, var(--ds-toggle-bg, var(--ds-color-background, #fff)));
  }
  .toggle:global(:focus-visible) {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: var(--ds-focus-ring-offset, 2px);
  }

  .toggle:global([data-state="on"]) {
    background: var(--ds-color-secondary, #7b52cc);
    color: var(--ds-color-on-secondary, #fff);
    border-color: var(--ds-color-secondary, #7b52cc);
  }

  .toggle:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
