import type { RadioGroupContext, RadioGroupState } from "./types";

// Navigation helpers are shared with other single-select collections.
export { firstEnabled, lastEnabled, nextEnabled, prevEnabled, step } from "../internal/collection";

/** Build the initial state from user context. */
export function initialState(context: RadioGroupContext): RadioGroupState {
  return {
    value: context.value ?? null,
    items: context.items,
    orientation: context.orientation ?? "vertical",
    disabled: context.disabled ?? false,
  };
}
