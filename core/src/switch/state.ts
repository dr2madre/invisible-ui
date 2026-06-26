import type { SwitchContext, SwitchState } from "./types";

/** Build the initial state from user context. */
export function initialState(context: SwitchContext = {}): SwitchState {
  return {
    checked: context.checked ?? false,
    disabled: context.disabled ?? false,
  };
}
