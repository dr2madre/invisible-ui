import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { contentId, triggerId } from "./state";
import type { NavigationMenuState } from "./types";

/** The public, framework-agnostic API for a connected navigation menu. */
export interface NavigationMenuApi {
  value: string | null;
  /** Whether the item with this value is open. */
  isOpen(value: string): boolean;
  /** Open the item with this value. */
  open(value: string): void;
  /** Close any open item. */
  close(): void;
  /** Toggle the item with this value. */
  toggle(value: string): void;
  /** Props for a panel item's trigger (`aria-expanded` / `aria-controls`). */
  getTriggerProps(value: string): ElementProps;
  /** Props for a panel item's content. */
  getContentProps(value: string): ElementProps;
}

export interface ConnectOptions {
  state: NavigationMenuState;
  /** Request a new open value; the adapter owns how state updates. */
  setValue: (value: string | null) => void;
  normalize?: Normalize;
}

/**
 * Connect navigation-menu state to prop getters. Each panel item is a disclosure
 * (trigger with `aria-expanded` / `aria-controls` over a labelled content
 * panel); at most one is open. Hover timing, positioning, focus movement and
 * outside dismissal are layered on by the adapter. Plain link items need no
 * wiring — render them as ordinary `<a>`s.
 */
export function connect({
  state,
  setValue,
  normalize = identityNormalize,
}: ConnectOptions): NavigationMenuApi {
  const { value, id } = state;

  const isOpen = (v: string) => value === v;
  const open = (v: string) => {
    if (value !== v) setValue(v);
  };
  const close = () => {
    if (value !== null) setValue(null);
  };
  const toggle = (v: string) => setValue(value === v ? null : v);

  return {
    value,
    isOpen,
    open,
    close,
    toggle,
    getTriggerProps: (v: string) =>
      normalize({
        id: triggerId(id, v),
        "aria-expanded": value === v,
        "aria-controls": value === v ? contentId(id, v) : undefined,
        "data-state": value === v ? "open" : "closed",
        onClick: () => toggle(v),
        onKeyDown: (event: Event) => {
          const key = (event as KeyboardEvent).key;
          if (key === "ArrowDown") {
            event.preventDefault();
            open(v);
          } else if (key === "Escape") {
            close();
          }
        },
      }),
    getContentProps: (v: string) =>
      normalize({
        id: contentId(id, v),
        "aria-labelledby": triggerId(id, v),
        "data-state": value === v ? "open" : "closed",
        onKeyDown: (event: Event) => {
          if ((event as KeyboardEvent).key === "Escape") close();
        },
      }),
  };
}
