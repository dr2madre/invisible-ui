import type { CheckboxContext, CheckboxState, CheckedState } from "./types";

/** Build the initial state from user context. */
export function initialState(context: CheckboxContext = {}): CheckboxState {
  return {
    checked: context.checked ?? false,
    disabled: context.disabled ?? false,
  };
}

/**
 * The value a checkbox advances to when activated. Both `false` and
 * `"indeterminate"` resolve to `true`; `true` resolves to `false`.
 */
export function nextChecked(checked: CheckedState): CheckedState {
  return checked === true ? false : true;
}
