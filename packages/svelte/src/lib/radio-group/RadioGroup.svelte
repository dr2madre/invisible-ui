<script context="module" lang="ts">
  let _uid = 0;
</script>

<script lang="ts">
  /**
   * RadioGroup — the styled, batteries-included radio group built on **native**
   * `<input type="radio">` items sharing a `name`. The browser provides single
   * selection, roving tabindex, arrow-key navigation, focus and form
   * participation (the selected value is submitted under `name`); this layer
   * adds the dot indicator and a vertical or horizontal layout.
   *
   * Items may carry an optional `label`; the `value` is used when omitted. The
   * group needs an accessible name via `label`. Colors are themeable CSS custom
   * properties (`--ds-radio-*`).
   */
  import { createRadioGroup, type Orientation, type RadioItem } from "./create-radio-group";

  /** An item, with an optional display label (falls back to `value`). */
  export type RadioGroupItem = RadioItem & { label?: string };

  export let items: RadioGroupItem[];
  export let value: string | null = null;
  export let disabled = false;
  /** Layout and arrow-key axis. Defaults to `vertical`. */
  export let orientation: Orientation = "vertical";
  /** Accessible name for the group (announced by screen readers). */
  export let label: string;
  /** Form field name — the selected value is submitted under it. */
  export let name: string | undefined = undefined;
  /** Called whenever the selected value changes. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const {
    state: radioState,
    setValue,
    name: groupName,
  } = createRadioGroup({ items, value, disabled, orientation, name, onValueChange });

  const labelId = `ds-radio-group-${++_uid}`;
</script>

<div class="radio-field">
  <span class="radio-field__label" id={labelId}>{label}</span>
  <div
    class="radio-group"
    role="radiogroup"
    aria-labelledby={labelId}
    aria-orientation={orientation}
    data-orientation={orientation}
  >
    {#each items as item (item.value)}
      <label class="radio" class:radio--disabled={disabled || item.disabled}>
        <input
          class="radio__input"
          type="radio"
          name={groupName}
          value={item.value}
          checked={$radioState.value === item.value}
          disabled={disabled || item.disabled}
          on:change={() => setValue(item.value)}
          data-state={$radioState.value === item.value ? "checked" : "unchecked"}
        />
        <span class="radio__dot" aria-hidden="true"></span>
        <span class="radio__label">{item.label ?? item.value}</span>
      </label>
    {/each}
  </div>
</div>

<style>
  .radio-field {
    display: grid;
    gap: var(--ds-radio-label-gap, 0.5rem);
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .radio-field__label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--ds-radio-gap, 0.5rem);
  }
  .radio-group[data-orientation="horizontal"] {
    flex-direction: row;
    flex-wrap: wrap;
    column-gap: var(--ds-radio-gap-horizontal, 1.25rem);
  }

  .radio {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  .radio--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* The native input is the accessible, focusable control; visually hidden,
     with the sibling `.radio__dot` painted from its :checked / :focus-visible. */
  .radio__input {
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
  .radio__dot {
    inline-size: var(--ds-radio-size, 1.1rem);
    block-size: var(--ds-radio-size, 1.1rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: 50%;
    display: inline-grid;
    place-content: center;
    flex: none;
  }
  .radio__input:checked + .radio__dot {
    border-color: var(--ds-color-secondary, #7b52cc);
  }
  .radio__input:checked + .radio__dot::after {
    content: "";
    inline-size: 0.6rem;
    block-size: 0.6rem;
    border-radius: 50%;
    background: var(--ds-color-secondary, #7b52cc);
  }
  .radio__input:focus-visible + .radio__dot {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
</style>
