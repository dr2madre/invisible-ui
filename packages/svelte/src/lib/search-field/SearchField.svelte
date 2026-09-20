<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { textField as core } from "@design-system/core";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { formReset } from "../internal/form-reset";
  import { createTextField } from "../text-field/create-text-field";

  const { t } = getI18n();

  /** Visible label and accessible name of the search input. */
  export let label: string;
  /** Visually hide the label while preserving the accessible name. */
  export let hideLabel = false;
  /** Initial or controlled search query. */
  export let value = "";
  /** Native input placeholder. It does not replace the label. */
  export let placeholder: string | undefined = undefined;
  export let disabled = false;
  export let required = false;
  export let readOnly = false;
  /** Native form field name. */
  export let name: string | undefined = undefined;
  /** Native browser autofill hint. */
  export let autocomplete: HTMLInputAttributes["autocomplete"] = undefined;
  /** Accessible name for the conditional clear button. */
  export let clearLabel: string | undefined = undefined;
  /** Accessible name for the native submit button. */
  export let submitLabel: string | undefined = undefined;
  /** Called once after a user edit or clear action is committed locally. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const field = createTextField({
    value,
    disabled,
    required,
    readOnly,
    onValueChange: (next) => onValueChange?.(next),
  });
  const { state: fieldState, labelAction, controlAction, setValue, syncValue } = field;

  let input: HTMLInputElement;
  let lastValue = value;
  let defaultValue = value;
  $: if (value !== lastValue) {
    lastValue = value;
    if (value !== $fieldState.value) defaultValue = value;
    syncValue(value);
  }
  $: field.setFlags({ disabled, required, readOnly });

  const restore = () => {
    lastValue = defaultValue;
    value = defaultValue;
    syncValue(defaultValue);
  };

  const onInput = (event: Event) => {
    value = (event.currentTarget as HTMLInputElement).value;
    setValue(value);
  };

  const clear = () => {
    if (disabled || readOnly || $fieldState.value === "") return;
    value = "";
    setValue("");
    input.focus();
  };
</script>

<div class="search-field" class:search-field--disabled={disabled}>
  <label
    class="search-field__label"
    class:search-field__label--hidden={hideLabel}
    for={core.controlId($fieldState.id)}
    id={core.labelId($fieldState.id)}
    use:labelAction
  >
    {label}{#if required}<span class="search-field__required" aria-hidden="true"> *</span>{/if}
  </label>

  <div class="search-field__control">
    <input
      bind:this={input}
      id={core.controlId($fieldState.id)}
      class="search-field__input"
      type="search"
      {name}
      {placeholder}
      {autocomplete}
      value={$fieldState.value}
      {defaultValue}
      on:input={onInput}
      use:controlAction
      use:formReset={restore}
    />
    {#if $fieldState.value && !disabled && !readOnly}
      <button
        class="search-field__action search-field__clear"
        type="button"
        aria-label={clearLabel ?? $t("searchField.clear")}
        on:click={clear}
      >
        <Icon><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
      </button>
    {/if}
    <button
      class="search-field__action search-field__submit"
      type="submit"
      aria-label={submitLabel ?? $t("searchField.submit")}
      {disabled}
    >
      <Icon><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>
    </button>
  </div>
</div>

<style>
  .search-field {
    display: grid;
    gap: var(--ds-field-gap, 0.375rem);
    inline-size: var(--ds-field-width, 18rem);
    max-inline-size: 100%;
    font: inherit;
    color: var(--ds-color-text, #282420);
  }
  .search-field__label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .search-field__label--hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .search-field__required {
    color: var(--ds-color-danger-body-text, #be3b50);
  }
  .search-field__control {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: stretch;
    min-inline-size: 0;
    overflow: clip;
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-field-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease;
  }
  .search-field__control:focus-within {
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .search-field__input {
    min-inline-size: 0;
    inline-size: 100%;
    box-sizing: border-box;
    padding: var(--ds-field-padding, 0.5rem 0.75rem);
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  .search-field__input::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }
  .search-field__action {
    display: inline-grid;
    place-items: center;
    min-inline-size: var(--ds-search-field-action-size, 2.5rem);
    min-block-size: var(--ds-search-field-action-size, 2.5rem);
    padding: 0.5rem 0.625rem;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .search-field__action :global(svg) {
    inline-size: 1.15rem;
    block-size: 1.15rem;
  }
  .search-field__action:hover {
    background: var(--ds-color-surface-hover, #eee9f8);
  }
  .search-field__action:focus-visible {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, #8e6cd4);
    outline-offset: calc(-1 * var(--ds-focus-ring-width, 2px));
  }
  .search-field__submit {
    border-inline-start: 1px solid var(--ds-color-border, #c7c1b7);
  }
  .search-field--disabled {
    color: var(--ds-color-text-disabled, #757067);
  }
  .search-field--disabled .search-field__control {
    background: var(--ds-color-disabled, #c7c1b7);
  }
  .search-field__action:disabled {
    cursor: not-allowed;
  }
</style>
