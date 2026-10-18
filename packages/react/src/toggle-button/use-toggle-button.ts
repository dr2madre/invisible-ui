import { toggleButton as core } from "@invisible-ui/core";
import { useMemo, useRef, type RefObject } from "react";
import { useResettable } from "../internal/form-reset";
import { normalizeProps } from "../normalize";

export interface UseToggleButtonOptions {
  /** Initial (uncontrolled) or current (controlled) pressed value. */
  pressed?: boolean;
  disabled?: boolean;
  /** Called whenever the pressed value changes. */
  onPressedChange?: (pressed: boolean) => void;
  /**
   * The native button this state renders on. Given it, the control puts its
   * default back when its form is reset, silently (ADR 0012).
   */
  controlRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Connect the headless toggle button to React: an independent on/off control
 * rendered as a native `<button aria-pressed>` (e.g. Bold in a toolbar). The
 * hook owns the resolved state and the default a form reset restores; the
 * core owns the behaviour. For a settings-style on/off control use
 * `useSwitch` instead.
 */
export function useToggleButton({
  pressed = false,
  disabled = false,
  onPressedChange,
  controlRef,
}: UseToggleButtonOptions = {}): core.ToggleButtonApi {
  // A button has no checked default for the browser to restore, so the
  // default is tracked here and put back on the owning form's reset.
  const ownRef = useRef<HTMLButtonElement | null>(null);
  const [value, setPressed] = useResettable(pressed, onPressedChange, controlRef ?? ownRef);

  return useMemo(
    () =>
      core.connect({
        state: { pressed: value, disabled },
        setPressed,
        normalize: normalizeProps,
      }),
    [value, disabled, setPressed],
  );
}
