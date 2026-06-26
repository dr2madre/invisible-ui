import type { ToggleButtonContext, ToggleButtonState } from "./types";

/** Build the initial state from user context. */
export function initialState(context: ToggleButtonContext = {}): ToggleButtonState {
  return {
    pressed: context.pressed ?? false,
    disabled: context.disabled ?? false,
  };
}

/**
 * Pure transition: flip the pressed value. Disabled toggle buttons never
 * change, so callers can apply this unconditionally.
 */
export function togglePressed(state: ToggleButtonState): ToggleButtonState {
  if (state.disabled) return state;
  return { ...state, pressed: !state.pressed };
}
