import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { contentId, triggerId } from "./state";
import type { PopoverState } from "./types";

/** The public, framework-agnostic API for a connected popover. */
export interface PopoverApi {
  open: boolean;
  /** Open the panel. */
  openPopover(): void;
  /** Close the panel. */
  closePopover(): void;
  /** Toggle the panel. */
  toggle(): void;
  /** Props for the trigger element. */
  triggerProps: ElementProps;
  /** Props for the content panel. */
  contentProps: ElementProps;
}

export interface ConnectOptions {
  state: PopoverState;
  /** Request the open state to change; the adapter owns how state updates. */
  setOpen: (open: boolean) => void;
  normalize?: Normalize;
}

/**
 * Connect popover state to prop getters. The trigger advertises the panel with
 * `aria-haspopup="dialog"` + `aria-expanded` and (while open) `aria-controls`;
 * the content closes on Escape. Mirrors the Radix/Bits popover wiring — focus
 * management and positioning are layered on by the adapter.
 */
export function connect({
  state,
  setOpen,
  normalize = identityNormalize,
}: ConnectOptions): PopoverApi {
  const { open, id } = state;

  const openPopover = () => {
    if (!open) setOpen(true);
  };
  const closePopover = () => {
    if (open) setOpen(false);
  };
  const toggle = () => setOpen(!open);

  return {
    open,
    openPopover,
    closePopover,
    toggle,
    triggerProps: normalize({
      id: triggerId(id),
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      "aria-controls": open ? contentId(id) : undefined,
      "data-state": open ? "open" : "closed",
      onClick: () => toggle(),
    }),
    contentProps: normalize({
      id: contentId(id),
      tabindex: -1,
      "data-state": open ? "open" : "closed",
      onKeyDown: (event: Event) => {
        if ((event as KeyboardEvent).key === "Escape") {
          event.preventDefault();
          closePopover();
        }
      },
    }),
  };
}
