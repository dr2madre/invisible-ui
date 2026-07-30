import { button as core } from "@design-system/core";
import { useMemo } from "react";
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
 * Connect the headless Button to React.
 *
 * Button has no internal state — it is a pure projection of its context — so
 * this hook only memoises `connect()`. The stateful hooks (`useCheckbox`,
 * `useSwitch`) follow the same shape with a `useState` behind them.
 */
export function useButton({
  variant = "default",
  disabled = false,
  type = "button",
  onPress,
  nativeButton = true,
}: UseButtonOptions = {}): core.ButtonApi {
  return useMemo(
    () =>
      core.connect({
        state: core.initialState({ variant, disabled }),
        onPress,
        type,
        nativeButton,
        normalize: normalizeProps,
      }),
    [variant, disabled, type, onPress, nativeButton],
  );
}
