import { toggleButton as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export type ToggleButtonApi = core.ToggleButtonApi;
export type ToggleButtonState = core.ToggleButtonState;

export interface UseToggleButtonOptions {
  /** Initial (uncontrolled) or current (controlled) pressed value. */
  pressed?: boolean;
  disabled?: boolean;
  /** Called whenever the pressed value changes. */
  onPressedChange?: (pressed: boolean) => void;
}

/**
 * Connect the headless toggle button to Vue: an independent on/off control
 * rendered as a native `<input type="checkbox">` styled to look like a button
 * (e.g. Bold in a toolbar). The browser owns the checkbox role, Space
 * activation, focus and form participation; the composable owns the resolved
 * pressed value, mirrored by a `watch` like {@link useSwitch}.
 *
 * For a settings-style on/off control use `useSwitch` instead.
 */
export function useToggleButton(
  options: MaybeRefOrGetter<UseToggleButtonOptions> = {},
): ComputedRef<ToggleButtonApi> {
  const resolved = computed(() => toValue(options));
  const pressed = ref(resolved.value.pressed ?? false);

  watch(
    () => resolved.value.pressed,
    (next) => {
      pressed.value = next ?? false;
    },
  );

  const setPressed = (next: boolean) => {
    if (pressed.value === next) return;
    pressed.value = next;
    resolved.value.onPressedChange?.(next);
  };

  return computed(() =>
    core.connect({
      state: { pressed: pressed.value, disabled: resolved.value.disabled ?? false },
      setPressed,
      normalize: normalizeProps,
    }),
  );
}
