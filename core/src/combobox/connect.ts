import { identityNormalize, type ElementProps, type Normalize } from "../types";
import {
  firstEnabled,
  inputId,
  labelId,
  labelOf,
  listboxId,
  nextEnabled,
  optionId,
  prevEnabled,
} from "./state";
import type { ComboboxItem, ComboboxState } from "./types";

/** The public, framework-agnostic API for a connected combobox. */
export interface ComboboxApi {
  open: boolean;
  value: string | null;
  inputValue: string;
  activeValue: string | null;
  selectedItem: ComboboxItem | null;
  /** Open the popup, highlighting the selected (or first enabled) option. */
  openListbox(): void;
  /** Close the popup. */
  closeListbox(): void;
  /** Highlight an option without selecting it. */
  setActive(value: string): void;
  /** Select a value (ignored when disabled); fills the input and closes. */
  select(value: string): void;
  /** Clear the selection and input text. */
  clear(): void;
  /** Props for the label element. */
  labelProps: ElementProps;
  /** Props for the input (`role="combobox"`). */
  inputProps: ElementProps;
  /** Props for the popup (`role="listbox"`). */
  listboxProps: ElementProps;
  /** Props for an option, by value (`role="option"`). */
  getOptionProps(value: string): ElementProps;
  /** Props for an optional clear button. */
  clearProps: ElementProps;
}

export interface ConnectOptions {
  state: ComboboxState;
  setValue: (value: string | null) => void;
  setOpen: (open: boolean) => void;
  setActiveValue: (value: string | null) => void;
  setInputValue: (text: string) => void;
  normalize?: Normalize;
}

/**
 * Connect combobox state to prop getters following the WAI-ARIA editable
 * combobox pattern (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). DOM
 * focus stays on the input; the highlighted option is conveyed through
 * `aria-activedescendant`. Enter selects the active option; Escape closes.
 * Home/End are left to the input (text caret), and typing/filtering is owned by
 * the adapter.
 */
export function connect({
  state,
  setValue,
  setOpen,
  setActiveValue,
  setInputValue,
  normalize = identityNormalize,
}: ConnectOptions): ComboboxApi {
  const { open, value, inputValue, activeValue, items, disabled, id } = state;

  const isItemDisabled = (v: string) => items.find((i) => i.value === v)?.disabled ?? false;
  const selectedItem = items.find((i) => i.value === value) ?? null;

  const openListbox = () => {
    if (disabled || open) return;
    // No first-item pre-highlight on open; only the selected value (if any).
    setActiveValue(value);
    setOpen(true);
  };
  const closeListbox = () => {
    if (!open) return;
    setOpen(false);
    setActiveValue(null);
  };
  const select = (v: string) => {
    if (disabled || isItemDisabled(v)) return;
    const item = items.find((i) => i.value === v);
    setValue(v);
    if (item) setInputValue(labelOf(item));
    closeListbox();
  };
  const clear = () => {
    setValue(null);
    setInputValue("");
    setActiveValue(null);
  };
  const move = (target: string | null) => {
    if (target != null) setActiveValue(target);
  };

  const onInputKeyDown = (event: Event) => {
    const key = (event as KeyboardEvent).key;
    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        openListbox();
        // Opening via keyboard highlights an option (selected, else first).
        setActiveValue(value ?? firstEnabled(items));
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
      case "Enter":
        if (activeValue != null) {
          event.preventDefault();
          select(activeValue);
        }
        break;
      case "Escape":
        event.preventDefault();
        closeListbox();
        break;
      case "Tab":
        closeListbox();
        break;
    }
  };

  return {
    open,
    value,
    inputValue,
    activeValue,
    selectedItem,
    openListbox,
    closeListbox,
    setActive: (v: string) => setActiveValue(v),
    select,
    clear,
    labelProps: normalize({
      id: labelId(id),
      for: inputId(id),
    }),
    inputProps: normalize({
      id: inputId(id),
      role: "combobox",
      "aria-expanded": open,
      "aria-controls": listboxId(id),
      "aria-autocomplete": "list",
      "aria-labelledby": labelId(id),
      "aria-activedescendant": open && activeValue ? optionId(id, activeValue) : undefined,
      "aria-disabled": disabled || undefined,
      autocomplete: "off",
      "data-state": open ? "open" : "closed",
      onKeyDown: onInputKeyDown,
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
          event.preventDefault(); // keep focus on the input
          select(v);
        },
        onMouseEnter: () => {
          if (!optionDisabled) setActiveValue(v);
        },
      });
    },
    clearProps: normalize({
      type: "button",
      tabindex: -1,
      "data-state": value || inputValue ? "active" : "empty",
      onMouseDown: (event: Event) => {
        event.preventDefault(); // keep focus on the input
        clear();
      },
    }),
  };
}
