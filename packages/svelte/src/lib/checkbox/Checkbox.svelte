<script lang="ts">
  /**
   * Checkbox — the styled, batteries-included checkbox built on a **native**
   * `<input type="checkbox">`. The browser provides the checkbox role, Space
   * activation, focus and form participation (`name`/`value`, `required`); this
   * layer only adds the box, the check / dash glyphs and the visible label, and
   * keeps the tri-state model (`true` / `false` / `"indeterminate"`).
   *
   * A `label` is required (a checkbox is meaningless without an accessible
   * name); pass the default slot to override it with rich content. The native
   * input is wrapped in a `<label>`, so clicking the box or text toggles it with
   * no extra wiring. Colors and sizing are themeable CSS custom properties
   * (`--ds-checkbox-*`).
   */
  import { createCheckbox, type CheckedState } from "./create-checkbox";
  import { indeterminate as indeterminateAction } from "../internal/indeterminate";
  import Icon from "../icon/Icon.svelte";

  /** Accessible, visible label (required). Override with the default slot for rich content. */
  export let label: string;
  export let checked: CheckedState = false;
  export let disabled = false;
  /** Form field name — the control's value is submitted under this when checked. */
  export let name: string | undefined = undefined;
  /** Value submitted with the form when checked. Defaults to the native `"on"`. */
  export let value = "on";
  /** Mark the control required for native form validation. */
  export let required = false;
  /** Called whenever the checked value changes. */
  export let onCheckedChange: ((c: CheckedState) => void) | undefined = undefined;

  const { state: cbState, setChecked } = createCheckbox({ checked, disabled, onCheckedChange });

  function onChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    setChecked(target.indeterminate ? "indeterminate" : target.checked);
  }

  $: dataState =
    $cbState.checked === "indeterminate"
      ? "indeterminate"
      : $cbState.checked
        ? "checked"
        : "unchecked";
</script>

<label class="field" class:field--disabled={disabled}>
  <input
    class="checkbox__input"
    type="checkbox"
    {name}
    {value}
    {required}
    {disabled}
    checked={$cbState.checked === true}
    use:indeterminateAction={$cbState.checked === "indeterminate"}
    on:change={onChange}
    data-state={dataState}
  />
  <span class="checkbox" aria-hidden="true">
    <Icon class="checkbox__glyph checkbox__check" size="100%" strokeWidth={3}>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
    <Icon class="checkbox__glyph checkbox__dash" size="100%" strokeWidth={3}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </Icon>
  </span>
  <span class="field__label"><slot>{label}</slot></span>
</label>

<style>
  .field {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-checkbox-gap, 0.5rem);
    cursor: pointer;
  }
  .field--disabled {
    cursor: not-allowed;
  }

  /* The native input is the accessible, focusable control; it's visually
     hidden and the sibling `.checkbox` is the painted box, driven by the
     input's :checked / :indeterminate / :focus-visible / :disabled states. */
  .checkbox__input {
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

  .checkbox {
    box-sizing: border-box;
    inline-size: var(--ds-checkbox-size, 1.25rem);
    block-size: var(--ds-checkbox-size, 1.25rem);
    /* Inset so the glyph never touches the box edge. */
    padding: var(--ds-checkbox-padding, 0.15rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-checkbox-radius, var(--ds-radius-control, 0.375rem));
    background: var(--ds-color-background, #fff);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ds-color-on-primary, #fff);
    flex: none;
  }
  /* Glyphs fill the padded content box; shown per checked state. The glyph
     lives in the Icon component's scope, so target it with :global. */
  .checkbox :global(.checkbox__glyph) {
    display: none;
  }
  .checkbox__input:checked + .checkbox :global(.checkbox__check) {
    display: block;
  }
  .checkbox__input:indeterminate + .checkbox :global(.checkbox__dash) {
    display: block;
  }
  .checkbox__input:focus-visible + .checkbox {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: var(--ds-focus-ring-offset, 2px);
  }

  .checkbox__input:checked + .checkbox,
  .checkbox__input:indeterminate + .checkbox {
    background: var(--ds-color-primary, #2563eb);
    border-color: var(--ds-color-primary, #2563eb);
  }
  .field--disabled .checkbox,
  .checkbox__input:disabled + .checkbox {
    opacity: 0.5;
  }
</style>
