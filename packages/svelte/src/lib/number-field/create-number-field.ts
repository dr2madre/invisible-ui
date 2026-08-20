import { i18n, numberField as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type NumberFieldApi = core.NumberFieldApi;
export type NumberFieldState = core.NumberFieldState;
export type NumberFieldContext = core.NumberFieldContext;
export type NumberFieldError = core.NumberFieldError;
export type NumberInputStatus = core.NumberInputStatus;

export interface CreateNumberFieldOptions extends NumberFieldContext {
  /** Domain-level invalid state supplied by the consumer. */
  invalid?: boolean;
  /** Ids of visible description/error elements. */
  describedBy?: string;
  messages?: Partial<core.NumberFieldMessages>;
}

/** The reactive extras a component can update after creation. */
export interface NumberFieldExtras {
  invalid?: boolean;
  describedBy?: string;
  messages?: Partial<core.NumberFieldMessages>;
}

/** The constraint and mode props mirrored reactively after creation. */
export interface NumberFieldConfig {
  locale?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  changeOnWheel?: boolean;
}

export interface CreateNumberField {
  state: Readable<NumberFieldState>;
  api: Readable<NumberFieldApi>;
  /** Reflect an externally controlled value without emitting callbacks. */
  syncValue: (value: number | null) => void;
  /** Reflect constraint/mode props without emitting callbacks. */
  syncConfig: (config: NumberFieldConfig) => void;
  /** Update invalid state, description ids, and localized button names. */
  setExtras: (extras: NumberFieldExtras) => void;
  /** Restore a value and its display unconditionally, without callbacks (form reset). */
  reset: (value: number | null) => void;
  labelAction: Action<HTMLElement>;
  inputAction: Action<HTMLElement>;
  incrementAction: Action<HTMLElement>;
  decrementAction: Action<HTMLElement>;
}

const resolveConfig = (config: NumberFieldConfig) => ({
  min: config.min != null && Number.isFinite(config.min) ? config.min : null,
  max: config.max != null && Number.isFinite(config.max) ? config.max : null,
  step: config.step != null && Number.isFinite(config.step) && config.step > 0 ? config.step : 1,
  disabled: config.disabled ?? false,
  readOnly: config.readOnly ?? false,
  required: config.required ?? false,
  changeOnWheel: config.changeOnWheel ?? false,
});

/**
 * Create a headless number field. Parsing, stepping, commit boundaries, and
 * the spinbutton semantics live in `@design-system/core`; this adapter wires
 * the state to Svelte stores, applies connected props via actions, and emits
 * `onValueChange` / `onValueCommit` from the core's guarded setters. Reflection
 * through `syncValue`/`syncConfig` never emits and never rewrites the text of
 * a focused input, so an active draft survives parent updates.
 */
export function createNumberField(context: CreateNumberFieldOptions = {}): CreateNumberField {
  const state = writable<NumberFieldState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-number-field") }),
  );
  const extras = writable<NumberFieldExtras>({
    invalid: context.invalid,
    describedBy: context.describedBy,
    messages: context.messages,
  });
  const baseId = get(state).id;

  const inputElement = () =>
    typeof document === "undefined" ? null : document.getElementById(core.inputId(baseId));
  const isEditing = () => {
    const input = inputElement();
    return input != null && input.ownerDocument.activeElement === input;
  };

  const api = derived([state, extras], ([$state, $extras]) =>
    core.connect({
      state: $state,
      setInputValue: (text) => state.update((s) => ({ ...s, inputValue: text })),
      setValue: (value) => {
        state.update((s) => ({ ...s, value }));
        context.onValueChange?.(value);
      },
      commitValue: (value) => {
        state.update((s) => ({ ...s, committedValue: value }));
        context.onValueCommit?.(value);
      },
      focus: () => inputElement()?.focus(),
      invalid: $extras.invalid,
      describedBy: $extras.describedBy,
      messages: $extras.messages,
      normalize: normalizeProps,
    }),
  );

  const syncValue = (value: number | null) => {
    state.update((s) => {
      // A controlled parent giving back the value it was just told about
      // must not disturb the draft or the commit boundary.
      if (Object.is(s.value, value)) return s;
      return {
        ...s,
        value,
        committedValue: value,
        inputValue: isEditing() ? s.inputValue : core.formatNumber(value, s.locale),
      };
    });
  };

  const syncConfig = (config: NumberFieldConfig) => {
    state.update((s) => {
      const locale = i18n.canonicalLocale(config.locale ?? i18n.DEFAULT_LOCALE);
      const next = { ...s, ...resolveConfig(config), locale };
      if (
        locale === s.locale &&
        next.min === s.min &&
        next.max === s.max &&
        next.step === s.step &&
        next.disabled === s.disabled &&
        next.readOnly === s.readOnly &&
        next.required === s.required &&
        next.changeOnWheel === s.changeOnWheel
      ) {
        return s;
      }
      // A locale change reformats an idle display; a focused draft is kept.
      if (locale !== s.locale && !isEditing()) {
        next.inputValue = core.formatNumber(s.committedValue, locale);
      }
      return next;
    });
  };

  const setExtras = (next: NumberFieldExtras) => extras.set(next);

  const reset = (value: number | null) => {
    state.update((s) => ({
      ...s,
      value,
      committedValue: value,
      inputValue: core.formatNumber(value, s.locale),
    }));
  };

  return {
    state,
    api,
    syncValue,
    syncConfig,
    setExtras,
    reset,
    labelAction: createPropsAction(api, (a) => a.labelProps),
    inputAction: createPropsAction(api, (a) => a.inputProps),
    incrementAction: createPropsAction(api, (a) => a.incrementProps),
    decrementAction: createPropsAction(api, (a) => a.decrementProps),
  };
}
