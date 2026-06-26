import { identityNormalize, type ElementProps, type Normalize } from "../types";
import {
  firstEnabled,
  labelId,
  lastEnabled,
  listboxId,
  nextEnabled,
  optionId,
  prevEnabled,
  triggerId,
} from "./state";
import type { SelectItem, SelectState } from "./types";

/** The public, framework-agnostic API for a connected select. */
export interface SelectApi {
  open: boolean;
  value: string | null;
  activeValue: string | null;
  /** The selected item, if any (for rendering the trigger's text). */
  selectedItem: SelectItem | null;
  /** Open the popup, highlighting the selected (or first enabled) option. */
  openListbox(): void;
  /** Close the popup. */
  closeListbox(): void;
  /** Highlight an option without selecting it. */
  setActive(value: string): void;
  /** Select a value (ignored when disabled); closes the popup. */
  select(value: string): void;
  /** Props for the label element. */
  labelProps: ElementProps;
  /** Props for the trigger (`role="combobox"`). */
  triggerProps: ElementProps;
  /** Props for the popup (`role="listbox"`). */
  listboxProps: ElementProps;
  /** Props for an option, by value (`role="option"`). */
  getOptionProps(value: string): ElementProps;
}

export interface ConnectOptions {
  state: SelectState;
  /** Request a new selected value; the adapter owns how state updates. */
  setValue: (value: string) => void;
  /** Request the open state to change; the adapter owns how state updates. */
  setOpen: (open: boolean) => void;
  /** Request a new active (highlighted) value. */
  setActiveValue: (value: string | null) => void;
  normalize?: Normalize;
}

/**
 * Connect select state to prop getters following the WAI-ARIA select-only
 * combobox pattern (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). DOM
 * focus stays on the trigger; the highlighted option is conveyed through
 * `aria-activedescendant`. Selection commits on Enter or click.
 */
export function connect({
  state,
  setValue,
  setOpen,
  setActiveValue,
  normalize = identityNormalize,
}: ConnectOptions): SelectApi {
  const { open, value, activeValue, items, disabled, id } = state;

  const isItemDisabled = (v: string) => items.find((i) => i.value === v)?.disabled ?? false;

  const selectedItem = items.find((i) => i.value === value) ?? null;

  const openListbox = () => {
    if (disabled || open) return;
    // Highlight the selected option, or the first enabled one.
    setActiveValue(value ?? firstEnabled(items));
    setOpen(true);
  };

  const closeListbox = () => {
    if (!open) return;
    setOpen(false);
    setActiveValue(null);
  };

  const select = (v: string) => {
    if (disabled || isItemDisabled(v)) return;
    setValue(v);
    closeListbox();
  };

  const move = (target: string | null) => {
    if (target != null) setActiveValue(target);
  };

  const onTriggerKeyDown = (event: Event) => {
    const key = (event as KeyboardEvent).key;
    if (!open) {
      // Keys that open the popup.
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        event.preventDefault();
        openListbox();
      }
      return;
    }
    switch (key) {
      case "ArrowDown":
        event.preventDefault();
        move(nextEnabled(items, activeValue));
        break;
      case "ArrowUp":
        event.preventDefault();
        move(prevEnabled(items, activeValue));
        break;
      case "Home":
        event.preventDefault();
        move(firstEnabled(items));
        break;
      case "End":
        event.preventDefault();
        move(lastEnabled(items));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (activeValue != null) select(activeValue);
        break;
      case "Escape":
        event.preventDefault();
        closeListbox();
        break;
      case "Tab":
        // Tab closes the popup but keeps focus moving naturally.
        closeListbox();
        break;
    }
  };

  return {
    open,
    value,
    activeValue,
    selectedItem,
    openListbox,
    closeListbox,
    setActive: (v: string) => setActiveValue(v),
    select,
    labelProps: normalize({
      id: labelId(id),
    }),
    triggerProps: normalize({
      id: triggerId(id),
      role: "combobox",
      "aria-haspopup": "listbox",
      "aria-expanded": open,
      "aria-controls": listboxId(id),
      // The trigger is named by the label plus its own (selected) text content.
      "aria-labelledby": `${labelId(id)} ${triggerId(id)}`,
      "aria-activedescendant": open && activeValue ? optionId(id, activeValue) : undefined,
      "aria-disabled": disabled || undefined,
      tabindex: disabled ? undefined : 0,
      "data-state": open ? "open" : "closed",
      "data-disabled": disabled ? "" : undefined,
      onClick: () => (open ? closeListbox() : openListbox()),
      onKeyDown: onTriggerKeyDown,
    }),
    listboxProps: normalize({
      id: listboxId(id),
      role: "listbox",
      "aria-labelledby": labelId(id),
      tabindex: -1,
      "data-state": open ? "open" : "closed",
    }),
    getOptionProps: (v: string) => {
      const optionDisabled = isItemDisabled(v);
      const selected = value === v;
      const active = activeValue === v;
      return normalize({
        id: optionId(id, v),
        role: "option",
        "aria-selected": selected,
        "aria-disabled": optionDisabled || undefined,
        "data-state": selected ? "selected" : "unselected",
        "data-active": active ? "" : undefined,
        "data-disabled": optionDisabled ? "" : undefined,
        "data-value": v,
        // Pointer down (not click) so selection wins the race with blur/close.
        onMouseDown: (event: Event) => {
          event.preventDefault(); // keep focus on the trigger
          select(v);
        },
        onMouseEnter: () => {
          if (!optionDisabled) setActiveValue(v);
        },
      });
    },
  };
}
