import { switchControl as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export interface UseSwitchOptions {
  /** Initial (uncontrolled) or current (controlled) checked value. */
  checked?: boolean;
  disabled?: boolean;
  /** Called whenever the on/off value changes. */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Connect the headless Switch to Vue. Same shape as {@link useCheckbox}: the
 * composable owns the resolved state, the core owns the behaviour, and an
 * externally controlled `checked` is mirrored by a `watch`.
 */
export function useSwitch(
  options: MaybeRefOrGetter<UseSwitchOptions> = {},
): ComputedRef<core.SwitchApi> {
  const resolved = computed(() => toValue(options));
  const value = ref(resolved.value.checked ?? false);

  watch(
    () => resolved.value.checked,
    (next) => {
      value.value = next ?? false;
    },
  );

  const setChecked = (next: boolean) => {
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
