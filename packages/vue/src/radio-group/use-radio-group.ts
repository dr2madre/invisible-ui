import { radioGroup as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export type RadioGroupOrientation = core.Orientation;
export type RadioItem = core.RadioItem;

export interface UseRadioGroupOptions {
  /** Ordered list of items. */
  items: RadioItem[];
  /** Initial (uncontrolled) or current (controlled) selected value. */
  value?: string | null;
  disabled?: boolean;
  /** Layout and arrow-key axis. Defaults to `vertical`. */
  orientation?: RadioGroupOrientation;
  /** Shared form/group name; generated when omitted so the radios group. */
  name?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
}

let nameCounter = 0;

/**
 * Connect the headless radio group to Vue. The group is backed by **native**
 * `<input type="radio">` items sharing a `name`: the browser owns single
 * selection, roving tabindex, arrow-key navigation and form participation
 * (the selected value is submitted under the shared `name`); the composable
 * only owns the controlled value, mirrored by a `watch` like the other
 * composables in this adapter.
 */
export function useRadioGroup(
  options: MaybeRefOrGetter<UseRadioGroupOptions>,
): ComputedRef<core.RadioGroupApi> {
  const resolved = computed(() => toValue(options));
  const name = resolved.value.name ?? `ds-radio-group-${++nameCounter}`;
  const value = ref<string | null>(resolved.value.value ?? null);

  watch(
    () => resolved.value.value,
    (next) => {
      value.value = next ?? null;
    },
  );

  const setValue = (next: string) => {
    if (value.value === next) return;
    value.value = next;
    resolved.value.onValueChange?.(next);
  };

  return computed(() =>
    core.connect({
      state: {
        value: value.value,
        items: resolved.value.items,
        orientation: resolved.value.orientation ?? "vertical",
        disabled: resolved.value.disabled ?? false,
      },
      setValue,
      name,
      normalize: normalizeProps,
    }),
  );
}
