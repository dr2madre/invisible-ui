import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { contentId, triggerId } from "./state";
import type { CollapsibleState } from "./types";

/** The public, framework-agnostic API for a connected collapsible. */
export interface CollapsibleApi {
  /** Whether the content is expanded. */
  open: boolean;
  /** Set the open state (ignored while disabled). */
  setOpen(open: boolean): void;
  /** Toggle the open state (ignored while disabled). */
  toggle(): void;
  /** Props for the collapsible container (styling hooks). */
  rootProps: ElementProps;
  /** Props for the trigger button (`<button>`). */
  triggerProps: ElementProps;
  /** Props for the content panel. */
  contentProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: CollapsibleState;
  /** Request a new open state; the adapter owns how state updates. */
  setOpen: (open: boolean) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect collapsible state to prop getters following the WAI-ARIA disclosure
 * pattern (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/): a single
 * trigger button (`aria-expanded` + `aria-controls`) that shows or hides one
 * content region. DOM-free; the adapter owns rendering and state updates.
 */
export function connect({
  state,
  setOpen,
  normalize = identityNormalize,
}: ConnectOptions): CollapsibleApi {
  const { open, disabled, id } = state;

  const set = (next: boolean) => {
    if (disabled) return;
    setOpen(next);
  };
  const toggle = () => set(!open);

  return {
    open,
    setOpen: set,
    toggle,
    rootProps: normalize({
      "data-state": open ? "open" : "closed",
      "data-disabled": disabled ? "" : undefined,
    }),
    triggerProps: normalize({
      type: "button",
      id: triggerId(id),
      "aria-expanded": open,
      "aria-controls": contentId(id),
      disabled: disabled || undefined,
      "data-state": open ? "open" : "closed",
      "data-disabled": disabled ? "" : undefined,
      onClick: () => toggle(),
    }),
    contentProps: normalize({
      id: contentId(id),
      hidden: !open,
      "data-state": open ? "open" : "closed",
      "data-disabled": disabled ? "" : undefined,
    }),
  };
}
