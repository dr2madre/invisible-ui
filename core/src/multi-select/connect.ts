import { identityNormalize, type ElementProps, type Normalize } from "../types";
import {
  addValue,
  firstEnabled,
  inputId,
  labelId,
  lastRemovableValue,
  listboxId,
  nextEnabled,
  optionId,
  prevEnabled,
  removeValue,
  resolveItem,
  valuesId,
} from "./state";
import type { MultiSelectItem, MultiSelectState } from "./types";

/** The public, framework-agnostic API for a connected multi select. */
export interface MultiSelectApi {
  open: boolean;
  values: string[];
  inputValue: string;
  activeValue: string | null;
  /** The selected items in selection order, with raw fallbacks for values
   * whose item is not currently listed. */
  selectedItems: MultiSelectItem[];
  /** Whether a value is currently selected. */
  isSelected(value: string): boolean;
  /** Whether a value could be added right now (state and max permitting). */
  canAdd(value: string): boolean;
  /** Open the popup with no pre-highlight (blocked when disabled/read-only). */
  openListbox(): void;
  /** Close the popup. */
  closeListbox(): void;
  /** Highlight an option without selecting it. */
  setActive(value: string): void;
  /** Add the value and keep the popup open for another choice. Reselecting a
   * selected value is a silent no-op; the filter text is cleared on a real
   * addition. */
  select(value: string): void;
  /** Remove a selected value (blocked when disabled/read-only or the item is
   * disabled). */
  remove(value: string): void;
  /** The Backspace policy body: remove the last removable value. */
  removeLast(): void;
  /** Props for the label element. */
  labelProps: ElementProps;
  /** Props for the input (`role="combobox"`). */
  inputProps: ElementProps;
  /** Props for the popup (`role="listbox"`, multiselectable). */
  listboxProps: ElementProps;
  /** Props for an option, by value (`role="option"`). */
  getOptionProps(value: string): ElementProps;
  /** Props for the selected-values (tag) list container. */
  valuesListProps: ElementProps;
}

export interface ConnectOptions {
  state: MultiSelectState;
  /** Request new values; the adapter owns how state updates. */
  setValues: (values: string[]) => void;
  setOpen: (open: boolean) => void;
  setActiveValue: (value: string | null) => void;
  setInputValue: (text: string) => void;
  normalize?: Normalize;
}

/**
 * Connect multi-select state to prop getters following the WAI-ARIA editable
 * combobox pattern with a multiselectable listbox. DOM focus stays on the
 * input; Enter adds the active option and keeps the popup open; Escape closes
 * without moving focus; selected options stay listed with
 * `aria-selected="true"` so their state remains reviewable. The pure
 * transitions return the same reference on a no-op, so a no-op never reaches
 * `setValues` and can never fire a callback.
 */
export function connect({
  state,
  setValues,
  setOpen,
  setActiveValue,
  setInputValue,
  normalize = identityNormalize,
}: ConnectOptions): MultiSelectApi {
  const { open, values, inputValue, activeValue, items, disabled, readOnly, max, id } = state;

  const inert = disabled || readOnly;
  const isItemDisabled = (v: string) => resolveItem(items, v).disabled ?? false;
  const isSelected = (v: string) => values.includes(v);
  const canAdd = (v: string) =>
    !inert && !isItemDisabled(v) && !isSelected(v) && (max == null || values.length < max);

  const applyValues = (next: string[]) => {
    if (next !== values) setValues(next);
  };

  const openListbox = () => {
    if (inert || open) return;
    setActiveValue(null);
    setOpen(true);
  };
  const closeListbox = () => {
    if (!open) return;
    setOpen(false);
    setActiveValue(null);
  };
  const select = (v: string) => {
    if (inert || isItemDisabled(v) || isSelected(v)) return;
    const next = addValue(values, v, max);
    if (next === values) return;
    applyValues(next);
    if (inputValue !== "") setInputValue("");
  };
  const remove = (v: string) => {
    if (inert || isItemDisabled(v)) return;
    applyValues(removeValue(values, v));
  };
  const removeLast = () => {
    if (inert) return;
    const target = lastRemovableValue(values, items);
    if (target != null) applyValues(removeValue(values, target));
  };
  const move = (target: string | null) => {
    if (target != null) setActiveValue(target);
  };

  const onInputKeyDown = (event: Event) => {
    const key = (event as KeyboardEvent).key;
    if (key === "Backspace") {
      // Only the explicit opt-in removes values, and only from an empty
      // input; otherwise Backspace edits text as usual.
      if (state.removeOnBackspace && inputValue === "" && !inert) {
        event.preventDefault();
        removeLast();
      }
      return;
    }
    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp") {
        if (inert) return;
        event.preventDefault();
        setActiveValue(firstEnabled(items));
        setOpen(true);
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
    values,
    inputValue,
    activeValue,
    selectedItems: values.map((v) => resolveItem(items, v)),
    isSelected,
    canAdd,
    openListbox,
    closeListbox,
    setActive: (v: string) => setActiveValue(v),
    select,
    remove,
    removeLast,
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
      readonly: readOnly || undefined,
      autocomplete: "off",
      "data-state": open ? "open" : "closed",
      "data-disabled": disabled ? "" : undefined,
      "data-readonly": readOnly ? "" : undefined,
      onKeyDown: onInputKeyDown,
    }),
    listboxProps: normalize({
      id: listboxId(id),
      role: "listbox",
      "aria-multiselectable": "true",
      "aria-labelledby": labelId(id),
      tabindex: -1,
      "data-state": open ? "open" : "closed",
    }),
    getOptionProps: (v: string) => {
      const optionDisabled = isItemDisabled(v);
      const selected = isSelected(v);
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
    valuesListProps: normalize({
      id: valuesId(id),
      "data-disabled": disabled ? "" : undefined,
      "data-readonly": readOnly ? "" : undefined,
    }),
  };
}
