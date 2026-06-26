import type { ButtonGroupContext, ButtonGroupState } from "./types";

/** Build the initial state from user context. */
export function initialState(context: ButtonGroupContext = {}): ButtonGroupState {
  return {
    orientation: context.orientation ?? "horizontal",
    label: context.label,
  };
}
