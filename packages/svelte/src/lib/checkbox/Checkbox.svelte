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
  import { domProps } from "../internal/dom-props";
  import Icon from "../icon/Icon.svelte";

  /** Accessible, visible label (required). Override with the default slot for rich content. */
  export let label: string;
  /**
   * Visually hide the label while keeping it as the accessible name (for a
   * checkbox whose meaning is carried by its surroundings, e.g. a selection
   * column). The label text is always required.
   */
  export let hideLabel = false;
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

  const {
    state: cbState,
    api,
    setChecked,
    syncChecked,
    syncDisabled,
    // The arrow wrapper reads the prop variable at call time, so replacing the
    // callback prop makes the next change call the new one, never a stale one.
  } = createCheckbox({ checked, disabled, onCheckedChange: (c) => onCheckedChange?.(c) });

  // Controllable mirrors, compared against the last prop value (never against
  // the store): an uncontrolled consumer whose prop never changes keeps its
  // internal interactions untouched. A sync never calls onCheckedChange.
  let lastChecked = checked;
  $: if (checked !== lastChecked) {
    lastChecked = checked;
    syncChecked(checked);
  }
  let lastDisabled = disabled;
  $: if (disabled !== lastDisabled) {
    lastDisabled = disabled;
    syncDisabled(disabled);
  }

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
    use:domProps={$api.rootDomProps}
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
  <span class="field__label" class:field__label--hidden={hideLabel}><slot>{label}</slot></span>
</label>

<style>
  .field {
    /* Anchors the hidden label: unanchored, it would sit at its static
       position outside any clipping and widen the page. */
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--ds-checkbox-gap, 0.5rem);
    cursor: pointer;
  }
  .field--disabled {
    cursor: not-allowed;
  }
  .field--disabled .field__label {
    color: var(--ds-color-text-disabled, #757067);
  }
  /* Kept in the accessibility tree (names the control), removed from view. */
  .field__label--hidden {
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
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-checkbox-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ds-color-on-secondary, #fff);
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
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: var(--ds-focus-ring-offset, 2px);
  }

  /* Checked: a faint selection-color fill with the glyph in the full selection
     color (coherent with the other selected elements), not a solid fill. */
  .checkbox__input:checked + .checkbox,
  .checkbox__input:indeterminate + .checkbox {
    background: color-mix(in srgb, var(--ds-color-secondary, #7a52cc) 10%, transparent);
    /* The glyph, not the edge, carries the state: the boundary keeps the
       control border, and the glyph takes the selection text form, which
       stays readable on the tint in both themes. */
    border-color: var(--ds-color-control-border, #757067);
    color: var(--ds-color-selected-text, #553d7f);
  }
  .field--disabled .checkbox,
  .checkbox__input:disabled + .checkbox {
    opacity: 0.5;
  }
</style>
