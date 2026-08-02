import { checkbox as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export type CheckedState = core.CheckedState;

export interface UseCheckboxOptions {
  /** Initial (uncontrolled) or current (controlled) checked value. */
  checked?: CheckedState;
  disabled?: boolean;
  /** Called whenever the checked value changes. */
  onCheckedChange?: (checked: CheckedState) => void;
}

/**
 * Connect the headless Checkbox to Vue.
 *
 * The composable owns the resolved state (a `ref`) and hands the core a
 * setter; `connect()` is recomputed inside a `computed`, so the handlers in
 * the returned prop bag always close over current state. An externally
 * controlled `checked` is mirrored by a `watch`, the Vue counterpart of the
 * React adapter's render-time sync and the Svelte adapter's reactive `$:`.
 */
export function useCheckbox(
  options: MaybeRefOrGetter<UseCheckboxOptions> = {},
): ComputedRef<core.CheckboxApi> {
  const resolved = computed(() => toValue(options));
  const value = ref<CheckedState>(resolved.value.checked ?? false);

  watch(
    () => resolved.value.checked,
    (next) => {
      value.value = next ?? false;
    },
  );

  const setChecked = (next: CheckedState) => {
    value.value = next;
    resolved.value.onCheckedChange?.(next);
  };

  return computed(() =>
    core.connect({
      state: { checked: value.value, disabled: resolved.value.disabled ?? false },
      setChecked,
      normalize: normalizeProps,
    }),
  );
}
