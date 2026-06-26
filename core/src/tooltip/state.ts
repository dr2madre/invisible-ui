import type { TooltipContext, TooltipState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: TooltipContext = {}): TooltipState {
  return {
    open: context.open ?? false,
    id: context.id ?? `ds-tooltip-${++idCounter}`,
  };
}

/** Id of the tooltip element (referenced by the trigger's `aria-describedby`). */
export const tooltipId = (baseId: string) => `${baseId}-tooltip`;
