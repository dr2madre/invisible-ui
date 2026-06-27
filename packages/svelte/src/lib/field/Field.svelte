<script lang="ts">
  /**
   * Field — a styled form field that wires a label, control, description and
   * error message together. Behaviour and accessibility (id linking,
   * aria-describedby, aria-invalid / aria-required) come from the headless field
   * (`@design-system/core`).
   *
   * The control is provided via the default slot, which exposes `controlProps`
   * (spread them onto your control) and `controlId`:
   *
   * ```svelte
   * <Field label="Email" description="We'll never share it." error={err} let:controlProps>
   *   <input type="email" {...controlProps} />
   * </Field>
   * ```
   *
   * Colors and spacing are themeable via `--ds-field-*`.
   */
  import { createField } from "./create-field";

  /** The field label. */
  export let label: string;
  /** Optional helper/description text. */
  export let description: string | undefined = undefined;
  /** Optional error message; when set, the field is marked invalid. */
  export let error: string | undefined = undefined;
  /** Whether the control is required. */
  export let required = false;
  /** Whether the field is disabled. */
  export let disabled = false;
  /** Base id; auto-generated when omitted. */
  export let id: string | undefined = undefined;

  const { api, update } = createField({
    id,
    required,
    disabled,
    invalid: Boolean(error),
    hasDescription: Boolean(description),
    hasError: Boolean(error),
  });

  $: update({
    required,
    disabled,
    invalid: Boolean(error),
    hasDescription: Boolean(description),
    hasError: Boolean(error),
  });
</script>

<div class="field" class:field--disabled={disabled} {...$api.rootProps}>
  <label class="field__label" for={$api.ids.control} id={$api.ids.label}>
    {label}{#if required}<span class="field__required" aria-hidden="true">*</span>{/if}
  </label>

  <slot controlProps={$api.controlProps} controlId={$api.ids.control} />

  {#if description}
    <p class="field__description" {...$api.descriptionProps}>{description}</p>
  {/if}
  {#if error}
    <p class="field__error" {...$api.errorProps}>{error}</p>
  {/if}
</div>

<style>
  .field {
    display: grid;
    gap: var(--ds-field-gap, 0.3rem);
    inline-size: var(--ds-field-width, 18rem);
  }
  .field__label {
    font: inherit;
    font-weight: var(--ds-field-label-weight, 500);
    color: var(--ds-field-label-color, var(--ds-color-text, #0f172a));
  }
  .field--disabled .field__label {
    color: var(--ds-color-text-disabled, #94a3b8);
  }
  .field__required {
    color: var(--ds-field-required-color, var(--ds-color-danger-500, #dc2626));
    margin-inline-start: 0.15em;
  }
  .field__description {
    margin: 0;
    font-size: 0.875em;
    color: var(--ds-field-description-color, var(--ds-color-text-secondary, #64748b));
  }
  .field__error {
    margin: 0;
    font-size: 0.875em;
    color: var(--ds-field-error-color, var(--ds-color-danger-600, #dc2626));
  }
</style>
