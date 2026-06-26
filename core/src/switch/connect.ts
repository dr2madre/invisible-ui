import { identityNormalize, type ElementProps, type Normalize } from "../types";
import type { SwitchState } from "./types";

/** The public, framework-agnostic API for a connected Switch. */
export interface SwitchApi {
  /** Whether the switch is on. */
  checked: boolean;
  /** Whether the switch is disabled. */
  disabled: boolean;
  /** Set the checked value explicitly (ignored when disabled). */
  setChecked(value: boolean): void;
  /** Flip the checked value (ignored when disabled). */
  toggle(): void;
  /**
   * Props for a native `<input type="checkbox" role="switch">`. The browser
   * owns Space activation, focus and form participation; `role="switch"` makes
   * screen readers announce on/off — clearer than a checkbox for settings. The
   * live `checked` value is a DOM property, so adapters bind it directly.
   */
  rootProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: SwitchState;
  /** Request a new checked value; the adapter owns how state updates. */
  setChecked: (value: boolean) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect Switch state to props for a native `<input type="checkbox">` with
 * `role="switch"`. Accessibility and form participation come from the browser;
 * the headless layer only owns the controlled value.
 */
export function connect({
  state,
  setChecked,
  normalize = identityNormalize,
}: ConnectOptions): SwitchApi {
  const { checked, disabled } = state;

  const toggle = () => {
    if (disabled) return;
    setChecked(!checked);
  };

  return {
    checked,
    disabled,
    setChecked: (value: boolean) => {
      if (disabled) return;
      setChecked(value);
    },
    toggle,
    rootProps: normalize({
      type: "checkbox",
      role: "switch",
      disabled: disabled || undefined,
      "data-state": checked ? "checked" : "unchecked",
      "data-disabled": disabled ? "" : undefined,
      onChange: (event: Event) => {
        if (disabled) return;
        setChecked((event.target as HTMLInputElement).checked);
      },
    }),
  };
}
