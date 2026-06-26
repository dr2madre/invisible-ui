<script lang="ts">
  /**
   * Switch — the styled, batteries-included switch built on a **native**
   * `<input type="checkbox" role="switch">`. The browser provides Space
   * activation, focus and form participation (`name`/`value`); `role="switch"`
   * makes screen readers announce on/off. This layer adds the sliding track and
   * thumb plus the visible label.
   *
   * Prefer this over a checkbox for instant on/off settings. A `label` is
   * required (the control needs an accessible name); pass the default slot to
   * override it with rich content. The native input is wrapped in a `<label>`,
   * so clicking the track or text toggles it. Colors and sizing are themeable
   * CSS custom properties (`--ds-switch-*`).
   */
  import { createSwitch } from "./create-switch";

  /** Accessible, visible label (required). Override with the default slot for rich content. */
  export let label: string;
  export let checked = false;
  export let disabled = false;
  /** Form field name — the value is submitted under it when on. */
  export let name: string | undefined = undefined;
  /** Value submitted with the form when on. Defaults to the native `"on"`. */
  export let value = "on";
  /** Mark the control required for native form validation. */
  export let required = false;
  /** Called whenever the on/off value changes. */
  export let onCheckedChange: ((c: boolean) => void) | undefined = undefined;

  const { state: swState, setChecked } = createSwitch({ checked, disabled, onCheckedChange });

  function onChange(event: Event) {
    setChecked((event.currentTarget as HTMLInputElement).checked);
  }
</script>

<label class="field" class:field--disabled={disabled}>
  <input
    class="switch__input"
    type="checkbox"
    role="switch"
    {name}
    {value}
    {required}
    {disabled}
    checked={$swState.checked}
    on:change={onChange}
    data-state={$swState.checked ? "checked" : "unchecked"}
  />
  <span class="switch" aria-hidden="true"></span>
  <span class="field__label"><slot>{label}</slot></span>
</label>

<style>
  .field {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-switch-gap, 0.5rem);
    cursor: pointer;
  }
  .field--disabled {
    cursor: not-allowed;
  }

  /* The native input is the accessible, focusable control; visually hidden, with
     the sibling `.switch` painted from its :checked / :focus-visible state. */
  .switch__input {
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

  .switch {
    inline-size: var(--ds-switch-width, 2.5rem);
    block-size: var(--ds-switch-height, 1.5rem);
    border-radius: var(--ds-radius-pill, 999px);
    background: var(--ds-color-border, #cbd5e1);
    position: relative;
    flex: none;
    transition: background-color 120ms ease;
  }
  .switch::after {
    content: "";
    position: absolute;
    inset-block-start: 0.125rem;
    inset-inline-start: 0.125rem;
    inline-size: calc(var(--ds-switch-height, 1.5rem) - 0.25rem);
    block-size: calc(var(--ds-switch-height, 1.5rem) - 0.25rem);
    border-radius: 50%;
    background: var(--ds-color-on-primary, #fff);
    transition: translate 150ms ease;
  }
  .switch__input:focus-visible + .switch {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: var(--ds-focus-ring-offset, 2px);
  }

  .switch__input:checked + .switch {
    background: var(--ds-color-primary, #2563eb);
  }
  .switch__input:checked + .switch::after {
    translate: calc(var(--ds-switch-width, 2.5rem) - var(--ds-switch-height, 1.5rem)) 0;
  }

  .field--disabled .switch,
  .switch__input:disabled + .switch {
    opacity: 0.5;
  }
</style>
