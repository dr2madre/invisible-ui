import { checkboxGroup as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export type CheckboxGroupItem = core.CheckboxGroupItem;

export interface UseCheckboxGroupOptions {
  items: CheckboxGroupItem[];
  /** Initial (uncontrolled) or current (controlled) selected values. */
  value?: string[];
  disabled?: boolean;
  /** Shared form field name applied to every item. */
  name?: string;
  /** Called whenever the selected values change. */
  onValueChange?: (value: string[]) => void;
}

/**
 * Connect the headless multi-select checkbox group to Vue. Behaviour and
 * accessibility live in `@design-system/core`: a native `<fieldset>` exposes
 * the group role and each item is a native `<input type="checkbox">`, so the
 * browser owns Space activation, focus and form participation (every checked
 * item submits its value under the shared `name`). The composable owns the
 * selection, mirrored by a `watch` like the other composables in this adapter.
 */
export function useCheckboxGroup(
  options: MaybeRefOrGetter<UseCheckboxGroupOptions>,
): ComputedRef<core.CheckboxGroupApi> {
  const resolved = computed(() => toValue(options));
  const value = ref<string[]>(resolved.value.value ?? []);

  watch(
    () => resolved.value.value,
    (next) => {
      value.value = next ?? [];
    },
  );

  const setValue = (next: string[]) => {
    value.value = next;
    resolved.value.onValueChange?.(next);
  };

  return computed(() =>
    core.connect({
      state: {
        value: value.value,
        items: resolved.value.items,
        disabled: resolved.value.disabled ?? false,
      },
      setValue,
      name: resolved.value.name,
      normalize: normalizeProps,
    }),
  );
}
