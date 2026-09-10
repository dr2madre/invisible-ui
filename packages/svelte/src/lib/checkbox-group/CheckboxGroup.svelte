<script lang="ts">
  /**
   * CheckboxGroup — the styled, batteries-included multi-select checkbox group
   * built on a native `<fieldset>` of `<input type="checkbox">` items. The
   * browser provides the group/checkbox roles, Space activation, focus and form
   * participation; this layer adds the box, the check glyph and the labels.
   *
   * A group `label` is required (rendered as the `<legend>`); each item carries
   * an optional `label` (falls back to `value`). Pass `name` to submit every
   * checked item's value under a shared field. Colors and sizing are themeable
   * CSS custom properties (`--ds-checkbox-*`).
   */
  import { createCheckboxGroup, type CheckboxGroupItem } from "./create-checkbox-group";
  import { formReset } from "../internal/form-reset";
  import Icon from "../icon/Icon.svelte";

  export let items: CheckboxGroupItem[];
  export let value: string[] = [];
  export let disabled = false;
  /** Accessible name for the group (required; rendered as the legend). */
  export let label: string;
  /** Shared form field name — each checked item submits its value under it. */
  export let name: string | undefined = undefined;
  /** Called whenever the selected values change. */
  export let onValueChange: ((value: string[]) => void) | undefined = undefined;

  // A live callback reference, so a swapped callback is honoured (ADR 0011).
  const {
    state: groupState,
    setValue,
    syncValue,
  } = createCheckboxGroup({
    items,
    value,
    disabled,
    onValueChange: (next) => onValueChange?.(next),
  });

  // Controllable mirror, compared against the last prop value (never against
  // the store). The selection is an array, so it is compared by content: a
  // parent echoing the reported value back must not churn. A sync never
  // reports a change.
  let lastValue = value;
  // The reset default follows the prop, except a give-back of what the
  // control itself reported (ADR 0012).
  let defaultValue = value;
  // The same selection, whatever order each side keeps it in: the machine
  // stores toggle order, a parent may store its own, and a re-ordered echo is
  // still a give-back.
  const sameValues = (a: string[], b: string[]) =>
    a.length === b.length && a.every((entry) => b.includes(entry));
  $: if (value !== lastValue) {
    lastValue = value;
    if (!sameValues(value, $groupState.value)) defaultValue = value;
    syncValue(value);
  }
  // The restore puts the control's own copy back beside the machine's, so a
  // later prop change is judged against what the page now shows (ADR 0012).
  const restore = () => {
    lastValue = defaultValue;
    value = defaultValue;
    syncValue(defaultValue);
  };

  function onItemChange(itemValue: string, event: Event) {
    const checked = (event.currentTarget as HTMLInputElement).checked;
    const current = $groupState.value;
    setValue(checked ? [...current, itemValue] : current.filter((v) => v !== itemValue));
  }
</script>

<fieldset class="checkbox-group" {disabled} use:formReset={restore}>
  <legend class="checkbox-group__label">{label}</legend>

  {#each items as item (item.value)}
    <label class="field" class:field--disabled={disabled || item.disabled}>
      <input
        class="checkbox__input"
        type="checkbox"
        {name}
        value={item.value}
        disabled={disabled || item.disabled}
        checked={$groupState.value.includes(item.value)}
        defaultChecked={defaultValue.includes(item.value)}
        on:change={(event) => onItemChange(item.value, event)}
        data-state={$groupState.value.includes(item.value) ? "checked" : "unchecked"}
      />
      <span class="checkbox" aria-hidden="true">
        <Icon class="checkbox__check" size="100%" strokeWidth={3}>
          <polyline points="20 6 9 17 4 12" />
        </Icon>
      </span>
      <span class="field__label">{item.label ?? item.value}</span>
    </label>
  {/each}
</fieldset>

<style>
  .checkbox-group {
    display: grid;
    gap: var(--ds-checkbox-group-gap, 0.5rem);
    /* Reset the native fieldset chrome. */
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
  }
  .checkbox-group__label {
    font-size: 0.875rem;
    font-weight: 600;
    margin-block-end: 0.125rem;
    padding: 0;
  }
  /* Disabled group/item dims its label too. */
  .checkbox-group:disabled .checkbox-group__label,
  .field--disabled .field__label {
    color: var(--ds-color-text-disabled, #757067);
  }

  .field {
    /* Anchors the hidden input: unanchored, it would sit at its static
       position outside any clipping and widen the page. */
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--ds-checkbox-gap, 0.5rem);
    cursor: pointer;
  }
  .field--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Native input is the accessible, focusable control; visually hidden, with
     the sibling `.checkbox` painted from its :checked / :focus-visible state. */
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
  .checkbox__input:focus-visible + .checkbox {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: var(--ds-focus-ring-offset, 2px);
  }
  /* Checked: faint selection-color fill + glyph in the full selection color
     (coherent with the standalone Checkbox), not a solid fill. */
  .checkbox__input:checked + .checkbox {
    background: color-mix(in srgb, var(--ds-color-secondary, #7a52cc) 10%, transparent);
    border-color: color-mix(in srgb, var(--ds-color-selected, #7a52cc) 35%, transparent);
    color: var(--ds-color-secondary, #7a52cc);
  }

  /* The check fills the padded content box; shown only when checked. The glyph
     lives in the Icon component's scope, so target it with :global. */
  .checkbox :global(.checkbox__check) {
    display: none;
  }
  .checkbox__input:checked + .checkbox :global(.checkbox__check) {
    display: block;
  }
  /* Forced colors: the focus sits on the hidden input, so the outline the
     theme forces there lands on something nobody can see. Draw it on the
     visible part instead. */
  @media (forced-colors: active) {
    .checkbox__input:focus-visible + .checkbox {
      outline: var(--ds-focus-ring-width, 2px) solid Highlight;
      outline-offset: 2px;
    }
  }
</style>
