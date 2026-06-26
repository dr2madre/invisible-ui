import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { nextChecked } from "./state";
import type { CheckboxState, CheckedState } from "./types";

/** The public, framework-agnostic API for a connected Checkbox. */
export interface CheckboxApi {
  /** Current checked value. */
  checked: CheckedState;
  /** Whether the checkbox is disabled. */
  disabled: boolean;
  /** Whether the box is in the mixed / indeterminate state. */
  indeterminate: boolean;
  /** Set the checked value explicitly (ignored when disabled). */
  setChecked(value: CheckedState): void;
  /** Advance the checked value (ignored when disabled). */
  toggle(): void;
  /**
   * Props for a native `<input type="checkbox">`. The browser owns the
   * checkbox role, Space activation, focus and form participation; the live
   * `checked` and `indeterminate` values are DOM *properties*, so adapters bind
   * those directly rather than via these (attribute-shaped) props.
   */
  rootProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: CheckboxState;
  /** Request a new checked value; the adapter owns how state updates. */
  setChecked: (value: CheckedState) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect Checkbox state to props for a **native** `<input type="checkbox">`.
 * Accessibility (role, keyboard, focus) and form participation come from the
 * browser; the headless layer only owns the controlled value and the
 * tri-state (indeterminate) resolution.
 */
export function connect({
  state,
  setChecked,
  normalize = identityNormalize,
}: ConnectOptions): CheckboxApi {
  const { checked, disabled } = state;
  const indeterminate = checked === "indeterminate";

  const toggle = () => {
    if (disabled) return;
    setChecked(nextChecked(checked));
  };

  return {
    checked,
    disabled,
    indeterminate,
    setChecked: (value: CheckedState) => {
      if (disabled) return;
      setChecked(value);
    },
    toggle,
    rootProps: normalize({
      type: "checkbox",
      disabled: disabled || undefined,
      "data-state": indeterminate ? "indeterminate" : checked === true ? "checked" : "unchecked",
      "data-disabled": disabled ? "" : undefined,
      onChange: (event: Event) => {
        if (disabled) return;
        const target = event.target as HTMLInputElement;
        // A native checkbox clears `indeterminate` on toggle, so read both.
        setChecked(target.indeterminate ? "indeterminate" : target.checked);
      },
    }),
  };
}
