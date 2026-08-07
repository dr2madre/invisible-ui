import { textField as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export interface UseTextFieldOptions {
  /** Initial (uncontrolled) or current (controlled) value. */
  value?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Whether the field is invalid (wires `aria-invalid` and the error link). */
  invalid?: boolean;
  /** Whether a description element is rendered (wires `aria-describedby`). */
  hasDescription?: boolean;
  /** Whether a success message is rendered (wires `aria-describedby`). */
  hasSuccess?: boolean;
  /** Base id linking the label, control, description and error. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the value changes. */
  onValueChange?: (value: string) => void;
}

/**
 * Connect the headless text field to Vue. Same shape as {@link useCheckbox}:
 * the composable owns the resolved value (a `ref`), the core owns the id
 * generation and the label / description / error / success wiring
 * (`for`, `aria-describedby`, `aria-invalid`, `aria-required`), and an
 * externally controlled `value` is mirrored by a `watch`. Shared by TextField
 * and Textarea, which differ only in the control they render.
 */
export function useTextField(
  options: MaybeRefOrGetter<UseTextFieldOptions> = {},
): ComputedRef<core.TextFieldApi> {
  const resolved = computed(() => toValue(options));
  // `initialState` also assigns the stable base id the part ids derive from.
  const initial = core.initialState({
    ...resolved.value,
    id: useStableId("ds-text-field"),
  });
  const value = ref(initial.value);

  watch(
    () => resolved.value.value,
    (next) => {
      value.value = next ?? "";
    },
  );

  const setValue = (next: string) => {
    value.value = next;
    resolved.value.onValueChange?.(next);
  };

  return computed(() =>
    core.connect({
      state: {
        value: value.value,
        disabled: resolved.value.disabled ?? false,
        readOnly: resolved.value.readOnly ?? false,
        required: resolved.value.required ?? false,
        invalid: resolved.value.invalid ?? false,
        hasDescription: resolved.value.hasDescription ?? false,
        hasSuccess: resolved.value.hasSuccess ?? false,
        id: initial.id,
      },
      setValue,
      normalize: normalizeProps,
    }),
  );
}
