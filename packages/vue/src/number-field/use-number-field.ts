import { i18n, numberField as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { useStableId } from "../internal/use-stable-id";
import { normalizeProps } from "../normalize";

export type NumberFieldApi = core.NumberFieldApi;
export type NumberFieldError = core.NumberFieldError;
export type NumberInputStatus = core.NumberInputStatus;

export interface UseNumberFieldOptions {
  /** Initial / controlled value, or `null` when empty. */
  value?: number | null;
  /** Explicit base id; a stable one is generated when omitted. */
  id?: string;
  /** BCP-47 locale for parsing and display. Defaults to the i18n scope. */
  locale?: string;
  min?: number;
  max?: number;
  /** Step for the spin actions; typed values are validated against it. */
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Opt in to wheel stepping while the input is focused and hovered. */
  changeOnWheel?: boolean;
  /** Domain-level invalid state supplied by the consumer. */
  invalid?: boolean;
  /** Ids of visible description/error elements. */
  describedBy?: string;
  messages?: Partial<core.NumberFieldMessages>;
  /** Called when the canonical value changes while editing. */
  onValueChange?: (value: number | null) => void;
  /** Called at commit boundaries: blur, Enter, and spin actions. */
  onValueCommit?: (value: number | null) => void;
}

export interface UseNumberField {
  /** Reactive connected API; spread the prop bags and call the operations. */
  api: ComputedRef<NumberFieldApi>;
  /** The current editing string, for binding to the input. */
  inputValue: ComputedRef<string>;
  /** Restore a value and its display unconditionally, without callbacks (form reset). */
  reset: (value: number | null) => void;
  /** Stable base id used to associate the label, input, and messages. */
  id: string;
}

/**
 * Connect the headless number field to Vue. Parsing, stepping, commit
 * boundaries, and the spinbutton semantics live in `@design-system/core`;
 * this composable owns the value/draft refs, mirrors an externally controlled
 * value without emitting, and keeps a focused draft untouched by reflection.
 */
export function useNumberField(
  options: MaybeRefOrGetter<UseNumberFieldOptions> = {},
): UseNumberField {
  const generatedId = useStableId("ds-number-field");
  const id = toValue(options).id ?? generatedId;
  const resolved = computed(() => toValue(options));

  const locale = computed(() => i18n.canonicalLocale(resolved.value.locale ?? i18n.DEFAULT_LOCALE));
  const min = computed(() => {
    const next = resolved.value.min;
    return next != null && Number.isFinite(next) ? next : null;
  });
  const max = computed(() => {
    const next = resolved.value.max;
    return next != null && Number.isFinite(next) ? next : null;
  });
  const step = computed(() => {
    const next = resolved.value.step;
    return next != null && Number.isFinite(next) && next > 0 ? next : 1;
  });

  const initialValue =
    resolved.value.value != null && Number.isFinite(resolved.value.value)
      ? resolved.value.value
      : null;
  const value = ref<number | null>(initialValue);
  const committedValue = ref<number | null>(initialValue);
  const inputValue = ref(core.formatNumber(initialValue, locale.value));

  const inputElement = () =>
    typeof document === "undefined" ? null : document.getElementById(core.inputId(id));
  const isEditing = () => {
    const input = inputElement();
    return input != null && input.ownerDocument.activeElement === input;
  };

  // Mirror an externally controlled value. A give-back of the value the field
  // just reported is a no-op; a real change reflects silently, and it only
  // rewrites the text while the input is not focused.
  watch(
    () => resolved.value.value,
    (next) => {
      const incoming = next != null && Number.isFinite(next) ? next : null;
      if (next === undefined || Object.is(incoming, value.value)) return;
      value.value = incoming;
      committedValue.value = incoming;
      if (!isEditing()) inputValue.value = core.formatNumber(incoming, locale.value);
    },
  );

  // A locale change reformats an idle display, but only when it shows the
  // committed value: a focused draft or a kept invalid draft is user data.
  watch(locale, (next, previous) => {
    if (isEditing()) return;
    if (inputValue.value !== core.formatNumber(committedValue.value, previous)) return;
    inputValue.value = core.formatNumber(committedValue.value, next);
  });

  const api = computed(() =>
    core.connect({
      state: {
        value: value.value,
        inputValue: inputValue.value,
        committedValue: committedValue.value,
        locale: locale.value,
        min: min.value,
        max: max.value,
        step: step.value,
        disabled: resolved.value.disabled ?? false,
        readOnly: resolved.value.readOnly ?? false,
        required: resolved.value.required ?? false,
        changeOnWheel: resolved.value.changeOnWheel ?? false,
        id,
      },
      setInputValue: (text) => {
        inputValue.value = text;
      },
      setValue: (next) => {
        value.value = next;
        resolved.value.onValueChange?.(next);
      },
      commitValue: (next) => {
        committedValue.value = next;
        resolved.value.onValueCommit?.(next);
      },
      focus: () => inputElement()?.focus(),
      invalid: resolved.value.invalid,
      describedBy: resolved.value.describedBy,
      messages: resolved.value.messages,
      normalize: normalizeProps,
    }),
  );

  const reset = (next: number | null) => {
    value.value = next;
    committedValue.value = next;
    inputValue.value = core.formatNumber(next, locale.value);
  };

  return {
    api,
    inputValue: computed(() => inputValue.value),
    reset,
    id,
  };
}
