import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { tooltipId } from "./state";
import type { TooltipState } from "./types";

/** The public, framework-agnostic API for a connected tooltip. */
export interface TooltipApi {
  open: boolean;
  /** Props for the trigger element. */
  triggerProps: ElementProps;
  /** Props for the tooltip element. */
  tooltipProps: ElementProps;
}

export interface ConnectOptions {
  state: TooltipState;
  normalize?: Normalize;
}

/**
 * Connect tooltip state to prop getters: the trigger is described by the tooltip
 * (`aria-describedby` while open) and the tooltip carries `role="tooltip"`. The
 * hover/focus wiring, open/close delays and positioning are layered on by the
 * adapter (which keeps the tooltip hoverable and Escape-dismissable per WCAG
 * 1.4.13).
 */
export function connect({ state, normalize = identityNormalize }: ConnectOptions): TooltipApi {
  const { open, id } = state;

  return {
    open,
    triggerProps: normalize({
      "aria-describedby": open ? tooltipId(id) : undefined,
      "data-state": open ? "open" : "closed",
    }),
    tooltipProps: normalize({
      id: tooltipId(id),
      role: "tooltip",
      "data-state": open ? "open" : "closed",
    }),
  };
}
