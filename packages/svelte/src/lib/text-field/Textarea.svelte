<script lang="ts">
  /**
   * Textarea — the styled, batteries-included multi-line text field. Shares the
   * headless text-field wiring (`@design-system/core`) with {@link TextField}:
   * label association, `aria-describedby` for the hint, error and success text,
   * and `aria-invalid` / `aria-required`. This layer renders a `<textarea>` plus
   * the label, optional description and error or success message.
   *
   * Passing a non-empty `error` puts the field in the invalid state and
   * announces the message. Colors and sizing are themeable CSS custom
   * properties (`--ds-field-*`).
   */
  import { createTextField } from "./create-text-field";
  import Icon from "../icon/Icon.svelte";

  /** Visible label, tied to the control. */
  export let label: string;
  export let value = "";
  export let placeholder: string | undefined = undefined;
  export let rows = 3;
  /** Optional hint shown under the control and linked via aria-describedby. */
  export let description: string | undefined = undefined;
  /** Error message; when non-empty the field becomes invalid and announces it. */
  export let error: string | undefined = undefined;
  /** Success/validated message; shows a green check and a confirming caption. */
  export let success: string | undefined = undefined;
  export let disabled = false;
  export let required = false;
  export let readOnly = false;
  /** Form field name — the value is submitted under it. */
  export let name: string | undefined = undefined;
  /** Native autofill hint forwarded to the control. */
  export let autocomplete: string | undefined = undefined;
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
  const { labelAction, controlAction, descriptionAction, errorAction, successAction, setValue } =
    field;

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
  <!-- The label is tied to the control at runtime via the headless primitive's
       `for`/`id` wiring (labelAction), which the compiler can't see statically. -->
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="field__label" use:labelAction>
    {label}{#if required}<span class="field__required" aria-hidden="true"> *</span>{/if}
  </label>

  <textarea
    class="field__control"
    {placeholder}
    {rows}
    {name}
    {autocomplete}
    {value}
    on:input={onInput}
    use:controlAction></textarea>

  {#if description}
    <p class="field__description" use:descriptionAction>{description}</p>
  {/if}
  {#if error}
    <p class="field__error" use:errorAction>
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
    <p class="field__success" use:successAction>
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
    color: var(--ds-color-text, #0f172a);
  }

  .field__label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .field--disabled .field__label {
    color: var(--ds-color-text-disabled, #94a3b8);
  }
  .field__required {
    color: var(--ds-color-danger-body-text, #dc2626);
  }

  .field__control {
    inline-size: 100%;
    box-sizing: border-box;
    padding: var(--ds-field-padding, 0.5rem 0.75rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-field-radius, var(--ds-radius-control, 0.5rem));
    color: inherit;
    font: inherit;
    resize: vertical;
    /* A visible drag grip: diagonal stripes tucked into the bottom-right corner,
       painted over the solid background (the native resize handle still works). */
    background:
      repeating-linear-gradient(
          -45deg,
          var(--ds-field-grip-color, var(--ds-color-border, #cbd5e1)) 0 1px,
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
    color: var(--ds-color-text-secondary, #64748b);
  }
  .field__control:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #2563eb);
    box-shadow: var(--ds-focus-ring-shadow);
  }

  .field__control:global([data-invalid]) {
    border-color: var(--ds-color-danger, #dc2626);
  }
  .field__control:global([data-invalid]):focus-visible {
    box-shadow: 0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-danger, #dc2626);
  }

  .field__control:global([data-disabled]) {
    background: var(--ds-color-disabled, #e2e8f0);
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }

  /* Help, error and success text match the control's (placeholder) text size. */
  .field__description {
    margin: 0;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .field__error,
  .field__success {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .field__error {
    color: var(--ds-color-danger-body-text, #dc2626);
  }
  .field__success {
    color: var(--ds-color-success-body-text, #16a34a);
  }
  .field__msg-icon {
    display: inline-flex;
    flex: none;
  }
  .field--success .field__control {
    border-color: var(--ds-color-success, #16a34a);
  }
</style>
