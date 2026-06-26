import type { AccordionContext, AccordionState } from "./types";

export { firstEnabled, lastEnabled, nextEnabled, prevEnabled } from "../internal/collection";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: AccordionContext): AccordionState {
  return {
    value: context.value ?? [],
    items: context.items,
    type: context.type ?? "single",
    collapsible: context.collapsible ?? true,
    disabled: context.disabled ?? false,
    orientation: context.orientation ?? "vertical",
    id: context.id ?? `ds-accordion-${++idCounter}`,
  };
}

/** Compute the next expanded set when an item is toggled. */
export function toggleValue(state: AccordionState, value: string): string[] {
  const open = state.value.includes(value);
  if (state.type === "multiple") {
    return open ? state.value.filter((v) => v !== value) : [...state.value, value];
  }
  // single
  if (open) return state.collapsible ? [] : state.value;
  return [value];
}

/** Id of the trigger (header button) for a value. */
export const triggerId = (baseId: string, value: string) => `${baseId}-trigger-${value}`;

/** Id of the panel for a value. */
export const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`;
