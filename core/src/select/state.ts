import { firstEnabled, lastEnabled, nextEnabled, prevEnabled } from "../internal/collection";
import type { SelectContext, SelectItem, SelectState } from "./types";

export { firstEnabled, lastEnabled, nextEnabled, prevEnabled };

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: SelectContext): SelectState {
  return {
    open: false,
    value: context.value ?? null,
    activeValue: null,
    items: context.items,
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-select-${++idCounter}`,
  };
}

/** Id of the label element. */
export const labelId = (baseId: string) => `${baseId}-label`;
/** Id of the trigger (combobox) element. */
export const triggerId = (baseId: string) => `${baseId}-trigger`;
/** Id of the listbox popup. */
export const listboxId = (baseId: string) => `${baseId}-listbox`;
/** Id of an option element, by value. */
export const optionId = (baseId: string, value: string) => `${baseId}-option-${value}`;

/** The visible text of an item (its label, falling back to the value). */
export const labelOf = (item: SelectItem) => item.label ?? item.value;

/**
 * Pure typeahead matcher: the value of the next enabled item whose label starts
 * with `query` (case-insensitive), searching after `fromValue` and wrapping.
 * Returns `null` when nothing matches.
 */
export function matchOption(
  items: SelectItem[],
  query: string,
  fromValue: string | null,
): string | null {
  if (!query) return null;
  const q = query.toLowerCase();
  const enabled = items.filter((item) => !item.disabled);
  if (enabled.length === 0) return null;

  const start = enabled.findIndex((item) => item.value === fromValue);
  // Begin the search just after the current item and wrap around.
  for (let i = 1; i <= enabled.length; i++) {
    const item = enabled[(start + i + enabled.length) % enabled.length];
    if (item && labelOf(item).toLowerCase().startsWith(q)) return item.value;
  }
  return null;
}
