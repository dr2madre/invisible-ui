import { identityNormalize, type ElementProps, type Normalize } from "../types";
import type { ToggleButtonState } from "./types";

/** The public, framework-agnostic API for a connected toggle button. */
export interface ToggleButtonApi {
  /** Whether the toggle button is currently pressed. */
  pressed: boolean;
  /** Whether the toggle button is disabled. */
  disabled: boolean;
  /** Set the pressed value explicitly (ignored when disabled). */
  setPressed(value: boolean): void;
  /** Flip the pressed value (ignored when disabled). */
  toggle(): void;
  /**
   * Props for the root `<button>` element: a toggle button uses `aria-pressed`
   * (it is a button that is on or off — e.g. Bold in a toolbar), plus
   * `data-state` / `data-disabled` styling hooks and a click handler. A native
   * `<button>` provides keyboard (Space/Enter), pointer and touch activation.
   */
  rootProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: ToggleButtonState;
  /** Request a new pressed value; the adapter owns how state actually updates. */
  setPressed: (value: boolean) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect toggle-button state to prop getters following the WAI-ARIA button
 * pattern with `aria-pressed`
 * (https://www.w3.org/WAI/ARIA/apg/patterns/button/). Unlike a switch, a toggle
 * button represents an on/off action and is well suited to toolbars.
 */
export function connect({
  state,
  setPressed,
  normalize = identityNormalize,
}: ConnectOptions): ToggleButtonApi {
  const { pressed, disabled } = state;

  const toggle = () => {
    if (disabled) return;
    setPressed(!pressed);
  };

  return {
    pressed,
    disabled,
    setPressed: (value: boolean) => {
      if (disabled) return;
      setPressed(value);
    },
    toggle,
    rootProps: normalize({
      type: "button",
      "aria-pressed": pressed,
      "data-state": pressed ? "on" : "off",
      "data-disabled": disabled ? "" : undefined,
      disabled: disabled || undefined,
      onClick: toggle,
    }),
  };
}
