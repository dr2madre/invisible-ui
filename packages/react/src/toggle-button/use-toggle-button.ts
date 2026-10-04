import { toggleButton as core } from "@design-system/core";
import { useMemo, type RefObject } from "react";
import { useCheckedState } from "../internal/checked-state";
import { normalizeProps } from "../normalize";

export interface UseToggleButtonOptions {
  /** Initial (uncontrolled) or current (controlled) pressed value. */
  pressed?: boolean;
  disabled?: boolean;
  /** Called whenever the pressed value changes. */
  onPressedChange?: (pressed: boolean) => void;
  /**
   * The native input this state renders on. Given it, the control carries the
   * DOM default a form reset restores, and puts its own state back when its
   * form is reset, silently (ADR 0012).
   */
  controlRef?: RefObject<HTMLInputElement | null>;
}

const isPressed = (value: boolean) => value;

/**
 * Connect the headless toggle button to React: an independent on/off control
 * rendered as a native `<input type="checkbox">` styled as a button (e.g. Bold
 * in a toolbar). Same shape as {@link useSwitch}: the hook owns the resolved
 * state, the core owns the behaviour. For a settings-style on/off control use
 * `useSwitch` instead.
 */
export function useToggleButton({
  pressed = false,
  disabled = false,
  onPressedChange,
  controlRef,
}: UseToggleButtonOptions = {}): core.ToggleButtonApi {
  const { checked, setChecked } = useCheckedState(pressed, onPressedChange, controlRef, isPressed);

  return useMemo(
    () =>
      core.connect({
        state: { pressed: checked, disabled },
        setPressed: setChecked,
        normalize: normalizeProps,
      }),
    [checked, disabled, setChecked],
  );
}
