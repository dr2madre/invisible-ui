<script lang="ts">
  /**
   * Field — a styled form field that wires a label, control, description and
   * error message together. Behaviour and accessibility (id linking,
   * aria-describedby, aria-invalid / aria-required) come from the headless field
   * (`@design-system/core`).
   *
   * The control is provided via the `children` snippet, which receives
   * `controlProps` (spread them onto your control) and `controlId`:
   *
   * ```svelte
   * <Field label="Email" description="We'll never share it." error={err}>
   *   {#snippet children({ controlProps })}
   *     <input type="email" {...controlProps} />
   *   {/snippet}
   * </Field>
   * ```
   *
   * Colors and spacing are themeable via `--ds-field-*`.
   */
  import { untrack, type Snippet } from "svelte";
  import { createField, type FieldApi } from "./create-field";

  interface Props {
    /** The field label. */
    label: string;
    /** Optional helper/description text. */
    description?: string;
    /** Optional error message; when set, the field is marked invalid. */
    error?: string;
    /** Whether the control is required. */
    required?: boolean;
    /** Whether the field is disabled. */
    disabled?: boolean;
    /** Base id; auto-generated when omitted. */
    id?: string;
    /** The control, given the props to spread onto it and its id. */
    children?: Snippet<[{ controlProps: FieldApi["controlProps"]; controlId: string }]>;
  }

  let {
    label,
    description,
    error,
    required = false,
    disabled = false,
    id,
    children,
  }: Props = $props();

  // Seeded once from the first props; the effect below follows later ones.
  const { api, update } = untrack(() =>
    createField({
      id,
      required,
      disabled,
      invalid: Boolean(error),
      hasDescription: Boolean(description),
      hasError: Boolean(error),
    }),
  );

  $effect.pre(() => {
    update({
      required,
      disabled,
      invalid: Boolean(error),
      hasDescription: Boolean(description),
      hasError: Boolean(error),
    });
  });
</script>

<div class={["field", disabled && "field--disabled"]} {...$api.rootProps}>
  <label class="field__label" for={$api.ids.control} id={$api.ids.label}>
    {label}{#if required}<span class="field__required" aria-hidden="true">*</span>{/if}
  </label>

  {@render children?.({ controlProps: $api.controlProps, controlId: $api.ids.control })}

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
    max-inline-size: 100%;
  }
  .field__label {
    font: inherit;
    font-weight: var(--ds-field-label-weight, 500);
    color: var(--ds-field-label-color, var(--ds-color-text, #282420));
  }
  .field--disabled .field__label {
    color: var(--ds-color-text-disabled, #757067);
  }
  .field__required {
    color: var(--ds-field-required-color, var(--ds-color-danger-body-text, #be3b50));
    margin-inline-start: 0.15em;
  }
  .field__description {
    margin: 0;
    font-size: 0.875em;
    color: var(--ds-field-description-color, var(--ds-color-text-secondary, #524c44));
  }
  .field__error {
    margin: 0;
    font-size: 0.875em;
    color: var(--ds-field-error-color, var(--ds-color-danger-body-text, #be3b50));
  }
</style>
