import { firstEnabled, lastEnabled, nextEnabled, prevEnabled } from "../internal/collection";
import type { MultiSelectContext, MultiSelectItem, MultiSelectState } from "./types";

export { firstEnabled, lastEnabled, nextEnabled, prevEnabled };

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: MultiSelectContext): MultiSelectState {
  return {
    open: false,
    values: context.values ?? [],
    inputValue: context.inputValue ?? "",
    activeValue: null,
    items: context.items,
    disabled: context.disabled ?? false,
    readOnly: context.readOnly ?? false,
    max: context.max ?? null,
    removeOnBackspace: context.removeOnBackspace ?? false,
    id: context.id ?? `ds-multi-select-${++idCounter}`,
  };
}

/** Id of the label element. */
export const labelId = (baseId: string) => `${baseId}-label`;
/** Id of the input (combobox) element. */
export const inputId = (baseId: string) => `${baseId}-input`;
/** Id of the listbox popup. */
export const listboxId = (baseId: string) => `${baseId}-listbox`;
/** Id of an option element, by value. */
export const optionId = (baseId: string, value: string) => `${baseId}-option-${value}`;
/** Id of the selected-values (tag) list container. */
export const valuesId = (baseId: string) => `${baseId}-values`;

/** The visible text of an item (its label, falling back to the value). */
export const labelOf = (item: MultiSelectItem) => item.label ?? item.value;

/**
 * The item behind a selected value. A value whose item is not in the current
 * list stays selected: it resolves to a raw fallback whose label is the value
 * itself, and it is never discarded here.
 */
export function resolveItem(items: MultiSelectItem[], value: string): MultiSelectItem {
  return items.find((item) => item.value === value) ?? { value, label: value };
}

/**
 * Add a value. No-ops return the same reference, so they can never reach a
 * setter: a duplicate addition, or an addition past `max`. `max` blocks
 * additions only; it never removes what is already selected.
 */
export function addValue(values: string[], value: string, max: number | null): string[] {
  if (values.includes(value)) return values;
  if (max != null && values.length >= max) return values;
  return [...values, value];
}

/** Remove a value (every occurrence). Absent value: same reference, no-op. */
export function removeValue(values: string[], value: string): string[] {
  if (!values.includes(value)) return values;
  return values.filter((existing) => existing !== value);
}

/**
 * The value Backspace may remove: the last one whose item is not disabled.
 * Disabled selected values are immune to Backspace.
 */
export function lastRemovableValue(values: string[], items: MultiSelectItem[]): string | null {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index]!;
    if (!(resolveItem(items, value).disabled ?? false)) return value;
  }
  return null;
}
