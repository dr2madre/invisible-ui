import { identityNormalize, type ElementProps, type Normalize } from "../types";
import {
  firstEnabled,
  lastEnabled,
  nextEnabled,
  panelId,
  prevEnabled,
  toggleValue,
  triggerId,
} from "./state";
import type { AccordionState } from "./types";

/** The public, framework-agnostic API for a connected accordion. */
export interface AccordionApi {
  /** Currently expanded item values. */
  value: string[];
  /** Replace the expanded set (disabled items are ignored on toggle). */
  setValue(value: string[]): void;
  /** Toggle a single item open/closed. */
  toggle(value: string): void;
  /** Props for the accordion container. */
  rootProps: ElementProps;
  /** Props for an item wrapper, by value (styling hooks). */
  getItemProps(value: string): ElementProps;
  /** Props for an item's trigger/header button (`<button>`). */
  getTriggerProps(value: string): ElementProps;
  /** Props for an item's panel (`role="region"`). */
  getPanelProps(value: string): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: AccordionState;
  /** Request a new expanded set; the adapter owns how state updates. */
  setValue: (value: string[]) => void;
  /** Move DOM focus to the trigger with the given value (adapter-provided). */
  focus?: (value: string) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect accordion state to prop getters following the WAI-ARIA accordion
 * pattern (https://www.w3.org/WAI/ARIA/apg/patterns/accordion/): header buttons
 * (`aria-expanded`) linked to regions, with optional arrow-key movement between
 * headers. Triggers stay in the tab order (no roving tabindex).
 */
export function connect({
  state,
  setValue,
  focus,
  normalize = identityNormalize,
}: ConnectOptions): AccordionApi {
  const { value, items, disabled, orientation, id } = state;

  const isOpen = (v: string) => value.includes(v);
  const isItemDisabled = (v: string) =>
    disabled || (items.find((i) => i.value === v)?.disabled ?? false);

  const toggle = (v: string) => {
    if (isItemDisabled(v)) return;
    setValue(toggleValue(state, v));
  };

  const moveFocus = (target: string | null) => {
    if (target != null) focus?.(target);
  };

  const [nextKey, prevKey] =
    orientation === "horizontal" ? ["ArrowRight", "ArrowLeft"] : ["ArrowDown", "ArrowUp"];

  return {
    value,
    setValue,
    toggle,
    rootProps: normalize({
      "data-orientation": orientation,
      "data-disabled": disabled ? "" : undefined,
    }),
    getItemProps: (v: string) =>
      normalize({
        "data-state": isOpen(v) ? "open" : "closed",
        "data-disabled": isItemDisabled(v) ? "" : undefined,
      }),
    getTriggerProps: (v: string) => {
      const open = isOpen(v);
      const itemDisabled = isItemDisabled(v);
      return normalize({
        type: "button",
        id: triggerId(id, v),
        "aria-expanded": open,
        "aria-controls": panelId(id, v),
        disabled: itemDisabled || undefined,
        "data-state": open ? "open" : "closed",
        "data-disabled": itemDisabled ? "" : undefined,
        "data-value": v,
        onClick: () => toggle(v),
        onKeyDown: (event: Event) => {
          const key = (event as KeyboardEvent).key;
          switch (key) {
            case nextKey:
              event.preventDefault();
              moveFocus(nextEnabled(items, v));
              break;
            case prevKey:
              event.preventDefault();
              moveFocus(prevEnabled(items, v));
              break;
            case "Home":
              event.preventDefault();
              moveFocus(firstEnabled(items));
              break;
            case "End":
              event.preventDefault();
              moveFocus(lastEnabled(items));
              break;
          }
        },
      });
    },
    getPanelProps: (v: string) =>
      normalize({
        role: "region",
        id: panelId(id, v),
        "aria-labelledby": triggerId(id, v),
        hidden: !isOpen(v),
        "data-state": isOpen(v) ? "open" : "closed",
      }),
  };
}
