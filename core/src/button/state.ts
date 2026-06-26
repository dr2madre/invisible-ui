import type { ButtonContext, ButtonState } from "./types";

/** Build the initial state from user context. */
export function initialState(context: ButtonContext = {}): ButtonState {
  return {
    disabled: context.disabled ?? false,
    variant: context.variant ?? "default",
  };
}
