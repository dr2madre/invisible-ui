import { identityNormalize, type DomProps, type ElementProps, type Normalize } from "../types";
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
   * checkbox role, Space activation, focus and form participation. `checked` is
   * left to the adapter's own controlled-input binding; `indeterminate` has no
   * attribute at all and is declared in {@link CheckboxApi.rootDomProps}.
   */
  rootProps: ElementProps;
  /**
   * DOM properties for the same `<input>`: `indeterminate`, which HTML cannot
   * express as an attribute. Adapters apply this bag generically — see
   * {@link DomProps}.
   */
  rootDomProps: DomProps;
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
    rootDomProps: { indeterminate },
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
