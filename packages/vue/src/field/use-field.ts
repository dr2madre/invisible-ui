import { field as core } from "@design-system/core";
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export interface UseFieldOptions {
  /** Base id linking the parts. Auto-generated when omitted. */
  id?: string;
  required?: boolean;
  /** Whether the field is invalid (wires `aria-invalid` and the error link). */
  invalid?: boolean;
  disabled?: boolean;
  /** Whether a description element is rendered (wires `aria-describedby`). */
  hasDescription?: boolean;
  /** Whether an error element is rendered (wires `aria-describedby`). */
  hasError?: boolean;
}

/**
 * Connect the headless field to Vue. A field wires a label, control,
 * description and error message together: id linking, `aria-describedby`,
 * `aria-invalid` / `aria-required` all live in `@design-system/core`. The
 * composable holds no state of its own beyond the stable base id; every flag
 * resolves from the options on each recompute.
 */
export function useField(
  options: MaybeRefOrGetter<UseFieldOptions> = {},
): ComputedRef<core.FieldApi> {
  const resolved = computed(() => toValue(options));
  // `initialState` also assigns the stable base id the part ids derive from.
  const initial = core.initialState(toValue(options));

  return computed(() =>
    core.connect({
      state: {
        id: initial.id,
        required: resolved.value.required ?? false,
        invalid: resolved.value.invalid ?? false,
        disabled: resolved.value.disabled ?? false,
        hasDescription: resolved.value.hasDescription ?? false,
        hasError: resolved.value.hasError ?? false,
      },
      normalize: normalizeProps,
    }),
  );
}
