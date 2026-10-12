import type { NavigationMenuContext, NavigationMenuState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: NavigationMenuContext = {}): NavigationMenuState {
  const value = context.value ?? null;
  return {
    value,
    // An item open from the start waits for the user to close it.
    kept: value !== null,
    id: context.id ?? `ds-navigation-menu-${++idCounter}`,
  };
}

/** Id of a trigger element, by value. */
export const triggerId = (baseId: string, value: string) => `${baseId}-trigger-${value}`;
/** Id of a content panel, by value. */
export const contentId = (baseId: string, value: string) => `${baseId}-content-${value}`;

/**
 * Pure transition for a press on a trigger: a press keeps the panel open, also
 * one the pointer opened; a press on a kept, open panel closes it.
 */
export function pressTrigger(state: NavigationMenuState, value: string): NavigationMenuState {
  if (state.value === value && state.kept) return { ...state, value: null, kept: false };
  return { ...state, value, kept: true };
}

/**
 * Pure transition for the pointer resting on a trigger: it opens that panel
 * for as long as the pointer stays. Switching from a kept panel keeps the new
 * one, so a press holds the menu open across hover switches.
 */
export function hoverOpen(state: NavigationMenuState, value: string): NavigationMenuState {
  if (state.value === value) return state;
  return { ...state, value, kept: state.value !== null && state.kept };
}

/** Pure transition for the pointer leaving: only a panel no press kept closes. */
export function hoverClose(state: NavigationMenuState): NavigationMenuState {
  if (state.kept || state.value === null) return state;
  return { ...state, value: null };
}
