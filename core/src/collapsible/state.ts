import type { CollapsibleContext, CollapsibleState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: CollapsibleContext = {}): CollapsibleState {
  return {
    open: context.open ?? false,
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-collapsible-${++idCounter}`,
  };
}

/** Id of the trigger (disclosure button). */
export const triggerId = (baseId: string) => `${baseId}-trigger`;

/** Id of the collapsible content. */
export const contentId = (baseId: string) => `${baseId}-content`;
