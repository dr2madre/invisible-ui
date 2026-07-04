<script lang="ts">
  /**
   * ToggleButton — the styled, batteries-included toggle button: an independent
   * on/off control (e.g. Bold in a toolbar), built on a native
   * `<input type="checkbox">` styled to look like a button. The browser owns the
   * checkbox role, Space activation, focus and form participation; this layer
   * adds the button surface and the on/off styling.
   *
   * Distinct from a switch: use `Switch` for a settings-style on/off control.
   * The label comes from the default slot; provide an explicit `label` when the
   * slot is icon-only so the control still has an accessible name. Pass `name`
   * (and optional `value`) to submit the pressed state with a form. Colors and
   * sizing are themeable CSS custom properties (`--ds-toggle-*`).
   */
  import { createToggleButton } from "./create-toggle-button";

  export let pressed = false;
  export let disabled = false;
  /** Accessible name; required when the slot content is icon-only. */
  export let label: string | undefined = undefined;
  /** Form field name — when checked, submits `value` under it. */
  export let name: string | undefined = undefined;
  /** Value submitted under `name` when pressed. */
  export let value = "on";
  /** Called whenever the pressed value changes. */
  export let onPressedChange: ((p: boolean) => void) | undefined = undefined;

  const { state: tbState, rootAction } = createToggleButton({ pressed, disabled, onPressedChange });
</script>

<label class="toggle" class:toggle--disabled={disabled}>
  <input
    class="toggle__input"
    use:rootAction
    checked={$tbState.pressed}
    {name}
    {value}
    aria-label={label}
  />
  <span class="toggle__surface"><slot /></span>
</label>

<style>
  .toggle {
    display: inline-flex;
    cursor: pointer;
  }
  .toggle--disabled {
    cursor: not-allowed;
  }

  /* The native checkbox is the accessible, focusable control; visually hidden,
     with the sibling `.toggle__surface` painted from its :checked /
     :focus-visible state. */
  .toggle__input {
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

  .toggle__surface {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    line-height: 1;
    min-inline-size: var(--ds-toggle-size, 2.25rem);
    block-size: var(--ds-toggle-size, 2.25rem);
    padding: 0 var(--ds-toggle-padding-inline, 0.5rem);
    border: 1px solid var(--ds-toggle-border, var(--ds-color-border, #cbd5e1));
    border-radius: var(--ds-toggle-radius, var(--ds-radius-control, 0.375rem));
    background: var(--ds-toggle-bg, var(--ds-color-background, #fff));
    color: var(--ds-color-text, #0f172a);
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      color 120ms ease;
  }
  .toggle__surface :global(svg) {
    inline-size: var(--ds-toggle-icon-size, 1.15rem);
    block-size: var(--ds-toggle-icon-size, 1.15rem);
  }
  /* Hover defaults to the rest background (no change); a flat toolbar overrides
     it with a subtle state overlay for affordance. */
  .toggle:hover .toggle__surface {
    background: var(--ds-toggle-bg-hover, var(--ds-toggle-bg, var(--ds-color-background, #fff)));
  }
  .toggle__input:focus-visible + .toggle__surface {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: var(--ds-focus-ring-offset, 2px);
  }
  /* On: a faint selection-colored fill + matching border + selection-color
     content (mirrors the standalone Checkbox — no weight change, which would
     shift width). */
  .toggle__input:checked + .toggle__surface {
    background: color-mix(in srgb, var(--ds-color-selected, #7b52cc) 10%, transparent);
    color: var(--ds-color-selected, #7b52cc);
    border-color: color-mix(in srgb, var(--ds-color-selected, #7b52cc) 35%, transparent);
  }
  .toggle--disabled .toggle__surface {
    opacity: 0.5;
  }
</style>
