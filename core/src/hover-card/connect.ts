import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { contentId, triggerId } from "./state";
import type { HoverCardState } from "./types";

/** The public, framework-agnostic API for a connected hover card. */
export interface HoverCardApi {
  open: boolean;
  /** Props for the trigger element. */
  triggerProps: ElementProps;
  /** Props for the content card. */
  contentProps: ElementProps;
}

export interface ConnectOptions {
  state: HoverCardState;
  normalize?: Normalize;
}

/**
 * Connect hover-card state to prop getters. The card is supplementary content
 * (Radix Hover Card semantics): the trigger and content only expose `data-state`
 * and a stable id — no dialog role, no `aria-haspopup`, and focus is never moved
 * into the card. The hover/focus open-close timing, positioning and dismissal
 * are layered on by the adapter.
 */
export function connect({ state, normalize = identityNormalize }: ConnectOptions): HoverCardApi {
  const { open, id } = state;

  return {
    open,
    triggerProps: normalize({
      id: triggerId(id),
      "data-state": open ? "open" : "closed",
    }),
    contentProps: normalize({
      id: contentId(id),
      "data-state": open ? "open" : "closed",
    }),
  };
}
