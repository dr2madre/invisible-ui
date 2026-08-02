import { button as core } from "@design-system/core";
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export type ButtonVariant = core.ButtonVariant;

export interface UseButtonOptions {
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  /** Called when the button is activated (click, or Enter/Space when emulated). */
  onPress?: (event: Event) => void;
  /**
   * Whether a native `<button>` is rendered (default). Set `false` when
   * rendering another element: role, focusability and Enter/Space activation
   * are then emulated by the core.
   */
  nativeButton?: boolean;
}

/**
 * Connect the headless Button to Vue.
 *
 * Button has no internal state (it is a pure projection of its context), so
 * this composable only wraps `connect()` in a `computed`. Options may be a
 * plain object, a ref or a getter; passing a getter over component props keeps
 * the api reactive. The stateful composables (`useCheckbox`, `useSwitch`)
 * follow the same shape with a `ref` behind them.
 */
export function useButton(
  options: MaybeRefOrGetter<UseButtonOptions> = {},
): ComputedRef<core.ButtonApi> {
  return computed(() => {
    const {
      variant = "default",
      disabled = false,
      type = "button",
      onPress,
      nativeButton = true,
    } = toValue(options);

    return core.connect({
      state: core.initialState({ variant, disabled }),
      onPress,
      type,
      nativeButton,
      normalize: normalizeProps,
    });
  });
}
