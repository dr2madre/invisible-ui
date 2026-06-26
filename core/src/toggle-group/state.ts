import type { ToggleGroupContext, ToggleGroupState } from "./types";

// Navigation helpers are shared with other roving collections.
export { firstEnabled, lastEnabled, nextEnabled, prevEnabled, step } from "../internal/collection";

/** Build the initial state from user context. */
export function initialState(context: ToggleGroupContext): ToggleGroupState {
  return {
    value: context.value ?? [],
    items: context.items,
    type: context.type ?? "single",
    orientation: context.orientation ?? "horizontal",
    disabled: context.disabled ?? false,
  };
}

/** Compute the next pressed set when an item is toggled. */
export function toggleValue(state: ToggleGroupState, value: string): string[] {
  const pressed = state.value.includes(value);
  if (state.type === "multiple") {
    return pressed ? state.value.filter((v) => v !== value) : [...state.value, value];
  }
  // single: pressing the active one clears it; otherwise it becomes the sole value.
  return pressed ? [] : [value];
}
