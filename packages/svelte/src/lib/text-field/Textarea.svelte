<script lang="ts">
  /**
   * Textarea — the styled, batteries-included multi-line text field. Shares the
   * headless text-field wiring (`@design-system/core`) with {@link TextField}:
   * label association, `aria-describedby` for the hint and error, and
   * `aria-invalid` / `aria-required`. This layer renders a `<textarea>` plus the
   * label, optional description, and validation message.
   *
   * Passing a non-empty `error` puts the field in the invalid state and
   * announces the message. Colors and sizing are themeable CSS custom
   * properties (`--ds-field-*`).
   */
  import { textField as core } from "@design-system/core";
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import Icon from "../icon/Icon.svelte";
  import { createTextField } from "./create-text-field";

  /** Visible label, tied to the control. */
  export let label: string;
  export let value = "";
  export let placeholder: string | undefined = undefined;
  export let rows = 3;
  /** Optional hint shown under the control and linked via aria-describedby. */
  export let description: string | undefined = undefined;
  /** Error message; when non-empty the field becomes invalid and announces it. */
  export let error: string | undefined = undefined;
  /** Success/validated message; shows a confirming caption. */
  export let success: string | undefined = undefined;
  export let disabled = false;
  export let required = false;
  export let readOnly = false;
  /** Form field name — the value is submitted under it. */
  export let name: string | undefined = undefined;
  /** Native textarea autocomplete hint. */
  export let autocomplete: HTMLTextareaAttributes["autocomplete"] = undefined;
  /** Native length limits; the browser enforces them and reports them. */
  export let maxlength: number | undefined = undefined;
  export let minlength: number | undefined = undefined;
  /** Turn spelling correction off for codes and identifiers. */
  export let spellcheck: boolean | undefined = undefined;
  /** Called whenever the value changes. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const field = createTextField({
    value,
    disabled,
    required,
    readOnly,
    invalid: !!error,
    hasDescription: !!description,
    hasSuccess: !!success,
    onValueChange,
  });
  const {
    state: fieldState,
    labelAction,
    controlAction,
    descriptionAction,
    errorAction,
    successAction,
    setValue,
  } = field;

  $: field.setFlags({
    disabled,
    required,
    readOnly,
    invalid: !!error,
    hasDescription: !!description,
    hasSuccess: !!success,
  });

  function onInput(event: Event) {
    value = (event.currentTarget as HTMLTextAreaElement).value;
    setValue(value);
  }
</script>

<div
  class="field"
  class:field--invalid={!!error}
  class:field--success={!!success && !error}
  class:field--disabled={disabled}
>
  <label
    class="field__label"
    for={core.controlId($fieldState.id)}
    id={core.labelId($fieldState.id)}
    use:labelAction
  >
    {label}{#if required}<span class="field__required" aria-hidden="true"> *</span>{/if}
  </label>

  <textarea
    class="field__control"
    {name}
    {autocomplete}
    {placeholder}
    {rows}
    {value}
    {maxlength}
    {minlength}
    {spellcheck}
    id={core.controlId($fieldState.id)}
    on:input={onInput}
    use:controlAction></textarea>

  {#if description}
    <p class="field__description" id={core.descriptionId($fieldState.id)} use:descriptionAction>
      {description}
    </p>
  {/if}
  {#if error}
    <p class="field__error" id={core.errorId($fieldState.id)} use:errorAction>
      <span class="field__msg-icon" aria-hidden="true">
        <Icon size="1em">
          <path
            d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12" y2="17" />
        </Icon>
      </span>
      {error}
    </p>
  {:else if success}
    <p class="field__success" id={core.successId($fieldState.id)} use:successAction>
      <span class="field__msg-icon" aria-hidden="true">
        <Icon size="1em"><polyline points="20 6 9 17 4 12" /></Icon>
      </span>
      {success}
    </p>
  {/if}
</div>

<style>
  .field {
    display: grid;
    gap: var(--ds-field-gap, 0.375rem);
    inline-size: var(--ds-field-width, 18rem);
    font: inherit;
    color: var(--ds-color-text, #282420);
  }

  .field__label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .field--disabled .field__label {
    color: var(--ds-color-text-disabled, #757067);
  }
  .field__required {
    color: var(--ds-color-danger-body-text, #be3b50);
  }

  .field__control {
    inline-size: 100%;
    box-sizing: border-box;
    padding: var(--ds-field-padding, 0.5rem 0.75rem);
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-field-radius, var(--ds-radius-control, 0.5rem));
    color: inherit;
    font: inherit;
    resize: vertical;
    /* A visible drag grip: diagonal stripes tucked into the bottom-right corner,
       painted over the solid background (the native resize handle still works). */
    background:
      repeating-linear-gradient(
          -45deg,
          var(--ds-field-grip-color, var(--ds-color-control-border, #757067)) 0 1px,
          transparent 1px 3px
        )
        bottom var(--ds-field-grip-inset, 3px) right var(--ds-field-grip-inset, 3px) / 9px 9px
        no-repeat,
      var(--ds-color-background, #fff);
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease;
  }
  .field__control::placeholder {
    color: var(--ds-color-text-secondary, #524c44);
  }
  .field__control:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }

  .field__control:global([data-invalid]) {
    border-color: var(--ds-color-danger, #be3b50);
  }
  .field__control:global([data-invalid]):focus-visible {
    box-shadow: 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-danger, #be3b50);
  }

  .field__control:global([data-disabled]) {
    background: var(--ds-color-disabled, #c7c1b7);
    color: var(--ds-color-text-disabled, #757067);
    cursor: not-allowed;
  }

  /* Help and error text match the control's (placeholder) text size. */
  .field__description {
    margin: 0;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .field__error,
  .field__success {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .field__error {
    color: var(--ds-color-danger-body-text, #be3b50);
  }
  .field__success {
    color: var(--ds-color-success-body-text, #3e7523);
  }
  .field__msg-icon {
    display: inline-flex;
    flex: none;
  }
  .field--success .field__control {
    border-color: var(--ds-color-success, #3e7523);
  }
</style>
