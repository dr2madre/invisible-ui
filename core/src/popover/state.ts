import type { PopoverContext, PopoverState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: PopoverContext = {}): PopoverState {
  return {
    open: context.open ?? false,
    id: context.id ?? `ds-popover-${++idCounter}`,
  };
}

/** Id of the trigger element. */
export const triggerId = (baseId: string) => `${baseId}-trigger`;
/** Id of the content panel. */
export const contentId = (baseId: string) => `${baseId}-content`;
