import type { NavigationMenuContext, NavigationMenuState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: NavigationMenuContext = {}): NavigationMenuState {
  return {
    value: context.value ?? null,
    id: context.id ?? `ds-navigation-menu-${++idCounter}`,
  };
}

/** Id of a trigger element, by value. */
export const triggerId = (baseId: string, value: string) => `${baseId}-trigger-${value}`;
/** Id of a content panel, by value. */
export const contentId = (baseId: string, value: string) => `${baseId}-content-${value}`;
