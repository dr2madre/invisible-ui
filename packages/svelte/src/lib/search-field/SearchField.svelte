<script lang="ts">
  import { untrack } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { textField as core } from "@design-system/core";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";
  import { createTextField } from "../text-field/create-text-field";

  const { t } = getI18n();

  interface Props {
    /** Visible label and accessible name of the search input. */
    label: string;
    /** Visually hide the label while preserving the accessible name. */
    hideLabel?: boolean;
    /** Initial or controlled search query. */
    value?: string;
    /** Native input placeholder. It does not replace the label. */
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
    /** Native form field name. */
    name?: string;
    /** Native browser autofill hint. */
    autocomplete?: HTMLInputAttributes["autocomplete"];
    /** Accessible name for the conditional clear button. */
    clearLabel?: string;
    /** Accessible name for the native submit button. */
    submitLabel?: string;
    /** Render the submit button; turn it off for a filter that applies as you type. */
    submitButton?: boolean;
    /** Called once after a user edit or clear action is committed locally. */
    onValueChange?: (value: string) => void;
  }

  let {
    label,
    hideLabel = false,
    value = $bindable(""),
    placeholder,
    disabled = false,
    required = false,
    readOnly = false,
    name,
    autocomplete,
    clearLabel,
    submitLabel,
    submitButton = true,
    onValueChange,
  }: Props = $props();

  // Seeded once from the first props; the mirror and the effect below follow
  // later ones.
  const field = untrack(() =>
    createTextField({
      value,
      disabled,
      required,
      readOnly,
      onValueChange: (next) => onValueChange?.(next),
    }),
  );
  const { state: fieldState, labelAction, controlAction, setValue, syncValue } = field;

  let input: HTMLInputElement | undefined;

  // Controllable mirror (ADR 0011), with the reset default of ADR 0012.
  const mirror = controllable({
    get: () => value,
    set: (next) => (value = next),
    reflect: syncValue,
    isGiveBack: (next) => next === $fieldState.value,
  });

  $effect.pre(() => {
    field.setFlags({ disabled, required, readOnly });
  });

  const onInput = (event: Event) => {
    const next = (event.currentTarget as HTMLInputElement).value;
    // The prop first, then the report (ADR 0011).
    mirror.write(next);
    setValue(next);
  };

  const clear = () => {
    if (disabled || readOnly || $fieldState.value === "") return;
    mirror.write("");
    setValue("");
    input?.focus();
  };
</script>

<div
  class={[
    "search-field",
    disabled && "search-field--disabled",
    !submitButton && "search-field--no-submit",
  ]}
>
  <label
    class={["search-field__label", hideLabel && "search-field__label--hidden"]}
    for={core.controlId($fieldState.id)}
    id={core.labelId($fieldState.id)}
    use:labelAction
  >
    {label}{#if required}<span class="search-field__required" aria-hidden="true"> *</span>{/if}
  </label>

  <div class="search-field__control">
    {#if !submitButton}
      <span class="search-field__icon" aria-hidden="true">
        <Icon><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>
      </span>
    {/if}
    <input
      bind:this={input}
      id={core.controlId($fieldState.id)}
      class="search-field__input"
      type="search"
      {name}
      {placeholder}
      {autocomplete}
      value={$fieldState.value}
      defaultValue={mirror.defaultValue}
      oninput={onInput}
      use:controlAction
      use:formReset={mirror.restore}
    />
    {#if $fieldState.value && !disabled && !readOnly}
      <button
        class="search-field__action search-field__clear"
        type="button"
        aria-label={clearLabel ?? $t("searchField.clear")}
        onclick={clear}
      >
        <Icon><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
      </button>
    {/if}
    {#if submitButton}
      <button
        class="search-field__action search-field__submit"
        type="submit"
        aria-label={submitLabel ?? $t("searchField.submit")}
        {disabled}
      >
        <Icon><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>
      </button>
    {/if}
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
  /* Without a submit button the glyph only marks the field as a search. */
  .search-field--no-submit .search-field__control {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
  .search-field__icon {
    display: inline-grid;
    place-items: center;
    padding-inline-start: 0.75rem;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .search-field__icon :global(svg) {
    inline-size: 1.15rem;
    block-size: 1.15rem;
  }
  .search-field--no-submit .search-field__input {
    padding-inline-start: 0.5rem;
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
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
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
  @media (forced-colors: active) {
    .search-field__input:focus-visible {
      outline-offset: calc(-1 * var(--ds-focus-ring-width, 2px));
    }
  }
</style>
