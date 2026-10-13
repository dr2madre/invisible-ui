import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { contentId, hoverClose, hoverOpen, pressTrigger, triggerId } from "./state";
import type { NavigationMenuState } from "./types";

/** The public, framework-agnostic API for a connected navigation menu. */
export interface NavigationMenuApi {
  value: string | null;
  /** Whether a press keeps the open panel open (see `NavigationMenuState.kept`). */
  kept: boolean;
  /** Whether the item with this value is open. */
  isOpen(value: string): boolean;
  /** Open the item with this value and keep it open. */
  open(value: string): void;
  /** Close any open item. */
  close(): void;
  /** A press on a trigger: keep its panel open, or close it when a press kept it. */
  toggle(value: string): void;
  /** The pointer rests on a trigger: open its panel while the pointer stays. */
  hoverOpen(value: string): void;
  /** The pointer left: close the open panel unless a press kept it. */
  hoverClose(): void;
  /**
   * Props for a panel item's trigger (`aria-expanded` / `aria-controls`).
   * `holdsCurrent` marks a trigger whose panel holds the current page: it
   * sets `data-current` for styling and is never announced as current.
   */
  getTriggerProps(value: string, options?: { holdsCurrent?: boolean }): ElementProps;
  /** Props for a panel item's content. */
  getContentProps(value: string): ElementProps;
  /**
   * Props for a link, in a panel or at the top level. A click closes the open
   * panel before the browser follows the link. `current` marks the link to
   * the page on screen: `aria-current="page"` and `data-current`.
   */
  getLinkProps(options?: { current?: boolean }): ElementProps;
}

export interface ConnectOptions {
  state: NavigationMenuState;
  /**
   * Request a new open value and whether a press keeps it open; the adapter
   * owns how state updates, and reports only a changed value.
   */
  setValue: (value: string | null, kept: boolean) => void;
  normalize?: Normalize;
}

/**
 * Connect navigation-menu state to prop getters. Each panel item is a disclosure
 * (trigger with `aria-expanded` / `aria-controls` over a labelled content
 * panel); at most one is open. The pointer resting on a trigger opens its
 * panel while it stays; a press keeps a panel open, also one the pointer
 * opened, and a second press closes it. Hover timing, positioning, focus
 * movement and outside dismissal are layered on by the adapter.
 */
export function connect({
  state,
  setValue,
  normalize = identityNormalize,
}: ConnectOptions): NavigationMenuApi {
  const { value, kept, id } = state;

  const apply = (next: NavigationMenuState) => {
    if (next.value !== value || next.kept !== kept) setValue(next.value, next.kept);
  };
  const isOpen = (v: string) => value === v;
  const open = (v: string) => apply({ ...state, value: v, kept: true });
  const close = () => apply({ ...state, value: null, kept: false });
  const toggle = (v: string) => apply(pressTrigger(state, v));

  return {
    value,
    kept,
    isOpen,
    open,
    close,
    toggle,
    hoverOpen: (v: string) => apply(hoverOpen(state, v)),
    hoverClose: () => apply(hoverClose(state)),
    getTriggerProps: (v: string, options = {}) =>
      normalize({
        id: triggerId(id, v),
        "aria-expanded": value === v,
        "aria-controls": value === v ? contentId(id, v) : undefined,
        "data-state": value === v ? "open" : "closed",
        "data-current": options.holdsCurrent ? "" : undefined,
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
    getLinkProps: (options = {}) =>
      normalize({
        "aria-current": options.current ? "page" : undefined,
        "data-current": options.current ? "" : undefined,
        onClick: close,
      }),
  };
}
