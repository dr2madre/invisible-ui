<script lang="ts">
  /**
   * NumberField — the styled, locale-aware decimal field. Behaviour and
   * accessibility (spinbutton semantics on a text input, locale parsing,
   * draft/value separation, stepping, commit boundaries) come from the
   * headless number field (`@design-system/core`); this layer adds the label,
   * spin buttons, optional description and error message, the hidden form
   * input, and the field styling. Themeable via `--ds-field-*`.
   */
  import { numberField as core } from "@design-system/core";
  import type { Action } from "svelte/action";
  import { getI18n } from "../i18n/create-i18n";
  import { createNumberField } from "./create-number-field";
  import type { NumberFieldError } from "./create-number-field";

  const { t, locale: providerLocale } = getI18n();

  /** Visible label, tied to the control. */
  export let label: string;
  /** The canonical value; `null` means empty. Bindable through `onValueChange`. */
  export let value: number | null = null;
  /** BCP-47 locale for parsing and display. Defaults to the provider's locale. */
  export let locale: string | undefined = undefined;
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  /** Step for the spin actions; typed values are validated against it. */
  export let step = 1;
  export let disabled = false;
  export let readOnly = false;
  export let required = false;
  /** Opt in to wheel stepping while the input is focused and hovered. */
  export let changeOnWheel = false;
  /** Optional hint shown under the control and linked via aria-describedby. */
  export let description: string | undefined = undefined;
  /** Error message; when non-empty the field becomes invalid and announces it. */
  export let error: string | undefined = undefined;
  /** Form field name; the canonical ASCII value is submitted under it. */
  export let name: string | undefined = undefined;
  /** Id of the owning form when the field renders outside of it. */
  export let form: string | undefined = undefined;
  /** Called when the canonical value changes while editing. */
  export let onValueChange: ((value: number | null) => void) | undefined = undefined;
  /** Called at commit boundaries: blur, Enter, and spin actions. */
  export let onValueCommit: ((value: number | null) => void) | undefined = undefined;

  $: resolvedLocale = locale ?? $providerLocale;

  const initialValue = value;
  const field = createNumberField({
    value,
    locale: locale ?? $providerLocale,
    min,
    max,
    step,
    disabled,
    readOnly,
    required,
    changeOnWheel,
    onValueChange: (next) => {
      lastValue = next;
      value = next;
      onValueChange?.(next);
    },
    onValueCommit: (next) => onValueCommit?.(next),
  });
  const {
    state: fieldState,
    api,
    syncValue,
    syncConfig,
    setExtras,
    labelAction,
    inputAction,
    incrementAction,
    decrementAction,
  } = field;
  const baseId = $fieldState.id;
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;

  // Last-prop mirror: only a value the parent actually changed reflects.
  let lastValue = value;
  $: if (!Object.is(value, lastValue)) {
    lastValue = value;
    syncValue(value);
  }
  $: syncConfig({
    locale: resolvedLocale,
    min,
    max,
    step,
    disabled,
    readOnly,
    required,
    changeOnWheel,
  });
  $: setExtras({
    invalid: Boolean(error),
    describedBy:
      [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") ||
      undefined,
    messages: {
      increment: $t("numberField.increment", { label }),
      decrement: $t("numberField.decrement", { label }),
    },
  });

  // Form reset restores the mount value and display without callbacks.
  // An action (not onMount) keeps this client-only and SSR-safe.
  const resetAction: Action<HTMLInputElement> = (node) => {
    const owner =
      node.form ??
      (form ? (node.ownerDocument.getElementById(form) as HTMLFormElement | null) : null);
    if (!owner) return;
    const onReset = () => field.reset(initialValue);
    owner.addEventListener("reset", onReset);
    return { destroy: () => owner.removeEventListener("reset", onReset) };
  };

  function onInput(event: Event) {
    $api.setDraft((event.currentTarget as HTMLInputElement).value);
  }

  const messageFor = (validationError: NumberFieldError | null) => {
    switch (validationError) {
      case "parse":
        return $t("numberField.parseError");
      case "range-underflow":
        return $t("numberField.rangeUnderflow", {
          min: core.formatNumber(min ?? 0, resolvedLocale),
        });
      case "range-overflow":
        return $t("numberField.rangeOverflow", {
          max: core.formatNumber(max ?? 0, resolvedLocale),
        });
      case "step-mismatch":
        return $t("numberField.stepMismatch", { step: core.formatNumber(step, resolvedLocale) });
      default:
        return undefined;
    }
  };

  $: validationMessage = error ?? messageFor($api.validationError);
</script>

<div
  class="number-field"
  class:number-field--invalid={Boolean(validationMessage)}
  class:number-field--disabled={disabled}
>
  <!-- The id pair is declared statically too, so the server-rendered markup
       already ties the label to its control before hydration. -->
  <label class="field__label" for={core.inputId(baseId)} id={core.labelId(baseId)} use:labelAction>
    {label}{#if required}<span class="field__required" aria-hidden="true"> *</span>{/if}
  </label>

  <div class="number-field__group">
    <button class="number-field__spin number-field__spin--decrement" use:decrementAction>
      <span aria-hidden="true">−</span>
    </button>
    <input
      class="field__control number-field__input"
      id={core.inputId(baseId)}
      value={$fieldState.inputValue}
      on:input={onInput}
      use:inputAction
      use:resetAction
    />
    <button class="number-field__spin number-field__spin--increment" use:incrementAction>
      <span aria-hidden="true">+</span>
    </button>
    {#if name}
      <input type="hidden" {name} {form} value={$api.formValue} disabled={disabled || undefined} />
    {/if}
  </div>

  {#if description}
    <p class="field__description" id={descriptionId}>{description}</p>
  {/if}
  <p
    id={errorId}
    class="field__error"
    aria-live="polite"
    role={error ? "alert" : undefined}
    hidden={!validationMessage}
  >
    {validationMessage ?? ""}
  </p>
</div>

<style>
  .number-field {
    display: grid;
    gap: var(--ds-field-gap, 0.375rem);
    inline-size: var(--ds-field-width, 18rem);
    max-inline-size: 100%;
    font: inherit;
    color: var(--ds-color-text, #282420);
  }

  .field__label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .number-field--disabled .field__label {
    color: var(--ds-color-text-disabled, #757067);
  }
  .field__required {
    color: var(--ds-color-danger-body-text, #be3b50);
  }

  .number-field__group {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: stretch;
  }

  .field__control {
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    padding: var(--ds-field-padding, 0.5rem 0.75rem);
    border: 1px solid var(--ds-color-control-border, #757067);
    background: var(--ds-color-background, #fff);
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease;
  }
  .number-field__input {
    border-radius: 0;
    border-inline: none;
    text-align: center;
  }
  .field__control:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .field__control:global([data-invalid]) {
    border-color: var(--ds-color-danger, #be3b50);
    box-shadow:
      0 0 0 var(--ds-focus-ring-width, 2px) var(--ds-color-danger, #be3b50),
      0 0 0 calc(var(--ds-focus-ring-width, 2px) + var(--ds-focus-halo-width, 3px))
        color-mix(in srgb, var(--ds-color-danger, #be3b50) 30%, transparent);
  }
  .field__control:global([data-disabled]) {
    background: var(--ds-color-disabled, #c7c1b7);
    color: var(--ds-color-text-disabled, #757067);
    cursor: not-allowed;
  }

  .number-field__spin {
    box-sizing: border-box;
    min-inline-size: 2.25rem;
    padding: 0 0.6rem;
    border: 1px solid var(--ds-color-control-border, #757067);
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #282420);
    font: inherit;
    font-size: 1.05em;
    line-height: 1;
    cursor: pointer;
  }
  .number-field__spin--decrement {
    border-start-start-radius: var(--ds-field-radius, var(--ds-radius-control, 0.5rem));
    border-end-start-radius: var(--ds-field-radius, var(--ds-radius-control, 0.5rem));
  }
  .number-field__spin--increment {
    border-start-end-radius: var(--ds-field-radius, var(--ds-radius-control, 0.5rem));
    border-end-end-radius: var(--ds-field-radius, var(--ds-radius-control, 0.5rem));
  }
  .number-field__spin:hover:not(:disabled) {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .number-field__spin:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .number-field__spin:disabled {
    color: var(--ds-color-text-disabled, #757067);
    cursor: not-allowed;
  }
  .number-field--disabled .number-field__spin {
    background: var(--ds-color-disabled, #c7c1b7);
  }

  .field__description {
    margin: 0;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .field__error {
    margin: 0;
    color: var(--ds-color-danger-body-text, #be3b50);
  }
</style>
