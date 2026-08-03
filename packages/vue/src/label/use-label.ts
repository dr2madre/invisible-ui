import { label as core } from "@design-system/core";
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export interface UseLabelOptions {
  /** Id of the control to associate with (`for`). */
  for?: string;
  /** Id for the label element itself (for `aria-labelledby` on the control). */
  id?: string;
}

/**
 * Connect the headless label to Vue. The core owns the `for`/`id` association
 * and prevents text selection when the label is clicked more than once; the
 * composable resolves the options into the connected prop bag.
 */
export function useLabel(
  options: MaybeRefOrGetter<UseLabelOptions> = {},
): ComputedRef<core.LabelApi> {
  const resolved = computed(() => toValue(options));

  return computed(() =>
    core.connect({
      state: {
        for: resolved.value.for ?? null,
        id: resolved.value.id ?? null,
      },
      normalize: normalizeProps,
    }),
  );
}
