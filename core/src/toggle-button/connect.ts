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
   * Props for a native `<input type="checkbox">`. A toggle button is an
   * independent on/off control, so it is a checkbox styled to look like a
   * button: the browser owns the checkbox role, Space activation, focus and
   * form participation, while `data-state` (`on`/`off`) and `data-disabled`
   * drive the button styling. The live `checked` value is a DOM *property*, so
   * adapters bind it directly rather than via these (attribute-shaped) props.
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
 * Connect toggle-button state to props for a **native** `<input
 * type="checkbox">`. A toggle button is an independent on/off control, so it is
 * a checkbox visually styled as a button — not an `aria-pressed` button and not
 * a switch. Accessibility (role, Space activation, focus) and form
 * participation come from the browser; the headless layer only owns the
 * controlled `pressed` (i.e. `checked`) value.
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
      type: "checkbox",
      disabled: disabled || undefined,
      "data-state": pressed ? "on" : "off",
      "data-disabled": disabled ? "" : undefined,
      onChange: (event: Event) => {
        if (disabled) return;
        setPressed((event.target as HTMLInputElement).checked);
      },
    }),
  };
}
