import type { HoverCardContext, HoverCardState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: HoverCardContext = {}): HoverCardState {
  return {
    open: context.open ?? false,
    id: context.id ?? `ds-hover-card-${++idCounter}`,
  };
}

/** Id of the trigger element. */
export const triggerId = (baseId: string) => `${baseId}-trigger`;
/** Id of the content card. */
export const contentId = (baseId: string) => `${baseId}-content`;
