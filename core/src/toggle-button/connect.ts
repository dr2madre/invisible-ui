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
   * Props for a native `<button type="button">` carrying `aria-pressed`. The
   * browser owns the button role, focus, and Enter and Space activation; a
   * click flips the pressed value. `data-state` (`on`/`off`) and
   * `data-disabled` drive the styling.
   */
  rootProps: ElementProps;
  /**
   * Props for an `<input type="hidden">` that submits `value` under `name`
   * while the button is pressed and enabled, or `null` when nothing is
   * submitted. Provisional: it keeps the form data a pressed toggle sent as a
   * checkbox, until form participation is decided.
   */
  getHiddenInputProps(field: { name?: string; value?: string }): ElementProps | null;
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
 * Connect toggle-button state to props for a native `<button>` with
 * `aria-pressed`, following the WAI-ARIA button pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/button/). The accessible name
 * never changes with the state: only `aria-pressed` does. It is an
 * independent on/off control, not a switch and not a checkbox.
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
      disabled: disabled || undefined,
      "data-state": pressed ? "on" : "off",
      "data-disabled": disabled ? "" : undefined,
      onClick: toggle,
    }),
    getHiddenInputProps: ({ name, value = "on" }) =>
      name && pressed && !disabled ? normalize({ type: "hidden", name, value }) : null,
  };
}
