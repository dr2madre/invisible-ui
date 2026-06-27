<script lang="ts">
  /**
   * TextField — the styled, batteries-included single-line text field. Behaviour
   * and accessibility (label association, `aria-describedby` for the hint and
   * error, `aria-invalid` / `aria-required`) come from the headless text field
   * (`@design-system/core`); this layer adds the label, control, optional
   * description and error message, and the focus / invalid styling.
   *
   * Covers the common single-line `type`s (text, search, email, password, tel,
   * url, number). Passing a non-empty `error` puts the field in the invalid
   * state and announces the message. Colors and sizing are themeable CSS custom
   * properties (`--ds-field-*`).
   */
  import { createTextField } from "./create-text-field";
  import Icon from "../icon/Icon.svelte";

  type InputType = "text" | "search" | "email" | "password" | "tel" | "url" | "number";

  /** Visible label, tied to the control. */
  export let label: string;
  export let value = "";
  export let type: InputType = "text";
  export let placeholder: string | undefined = undefined;
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
  /** Called whenever the value changes. */
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const field = createTextField({
    value,
    disabled,
    required,
    readOnly,
    invalid: !!error,
    hasDescription: !!description,
    onValueChange,
  });
  const { labelAction, controlAction, descriptionAction, errorAction, setValue } = field;

  // Keep the headless state in sync with reactive props so the wiring
  // (aria-invalid, aria-describedby, disabled…) stays correct.
  $: field.setFlags({
    disabled,
    required,
    readOnly,
    invalid: !!error,
    hasDescription: !!description,
  });

  function onInput(event: Event) {
    value = (event.currentTarget as HTMLInputElement).value;
    setValue(value);
  }

  // A built-in green check (right) when validated, unless a custom right slot is used.
  $: showSuccessIcon = !!success && !error && !$$slots.right;
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

  <div class="field__input">
    {#if $$slots.left}
      <span class="field__icon field__icon--left" aria-hidden="true"><slot name="left" /></span>
    {/if}
    <input
      class="field__control"
      class:field__control--icon-left={$$slots.left}
      class:field__control--icon-right={$$slots.right || showSuccessIcon}
      {type}
      {name}
      {placeholder}
      {value}
      on:input={onInput}
      use:controlAction
    />
    {#if $$slots.right}
      <span class="field__icon field__icon--right" aria-hidden="true"><slot name="right" /></span>
    {:else if showSuccessIcon}
      <span class="field__icon field__icon--right field__icon--success" aria-hidden="true">
        <Icon><polyline points="20 6 9 17 4 12" /></Icon>
      </span>
    {/if}
  </div>

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
    <p class="field__success">
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
  /* A disabled control dims its label too, so the relationship reads clearly. */
  .field--disabled .field__label {
    color: var(--ds-color-text-disabled, #94a3b8);
  }
  .field__required {
    color: var(--ds-color-danger, #dc2626);
  }

  /* Wraps the control so leading/trailing icons can overlay it. */
  .field__input {
    position: relative;
    display: flex;
    align-items: center;
  }
  .field__icon {
    position: absolute;
    display: inline-flex;
    align-items: center;
    color: var(--ds-color-text-secondary, #64748b);
    pointer-events: none;
  }
  .field__icon :global(svg) {
    inline-size: 1.15em;
    block-size: 1.15em;
  }
  .field__icon--left {
    inset-inline-start: 0.7rem;
  }
  .field__icon--right {
    inset-inline-end: 0.7rem;
  }
  /* Compound selectors so the icon padding beats the `.field__control` padding
     shorthand regardless of source order (otherwise text overlaps the icon). */
  .field__control.field__control--icon-left {
    padding-inline-start: 2.3rem;
  }
  .field__control.field__control--icon-right {
    padding-inline-end: 2.3rem;
  }

  .field__control {
    inline-size: 100%;
    box-sizing: border-box;
    padding: var(--ds-field-padding, 0.5rem 0.75rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-field-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    color: inherit;
    font: inherit;
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

  /* Invalid: a danger ring (same ring+halo gradation as focus, danger color)
     around the border, shown whenever the field is in error — not only on focus. */
  .field__control:global([data-invalid]) {
    border-color: var(--ds-color-danger, #dc2626);
    box-shadow:
      0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-danger, #dc2626),
      0 0 0 calc(var(--ds-focus-ring-width, 2px) + var(--ds-focus-halo-width, 3px))
        color-mix(in srgb, var(--ds-color-danger, #dc2626) 30%, transparent);
  }

  .field__control:global([data-disabled]) {
    background: var(--ds-color-disabled, #e2e8f0);
    color: var(--ds-color-text-disabled, #94a3b8);
    cursor: not-allowed;
  }

  /* Help and error text match the control's (placeholder) text size. */
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
    color: var(--ds-color-danger, #dc2626);
  }
  .field__success {
    color: var(--ds-color-success, #16a34a);
  }
  .field__msg-icon {
    display: inline-flex;
    flex: none;
  }
  /* Success/validated: green check inside the field + green border. */
  .field__icon--success {
    color: var(--ds-color-success, #16a34a);
  }
  .field--success .field__control {
    border-color: var(--ds-color-success, #16a34a);
  }
</style>
