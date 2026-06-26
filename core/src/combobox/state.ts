import { firstEnabled, lastEnabled, nextEnabled, prevEnabled } from "../internal/collection";
import type { ComboboxContext, ComboboxItem, ComboboxState } from "./types";

export { firstEnabled, lastEnabled, nextEnabled, prevEnabled };

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: ComboboxContext): ComboboxState {
  return {
    open: false,
    value: context.value ?? null,
    inputValue: context.inputValue ?? "",
    activeValue: null,
    items: context.items,
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-combobox-${++idCounter}`,
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

/** The visible text of an item (its label, falling back to the value). */
export const labelOf = (item: ComboboxItem) => item.label ?? item.value;
