import { firstEnabled } from "../internal/collection";
import type { TabsContext, TabsState } from "./types";

export { firstEnabled, lastEnabled, nextEnabled, prevEnabled } from "../internal/collection";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: TabsContext): TabsState {
  return {
    // Default to the first enabled tab so a panel is always shown.
    value: context.value ?? firstEnabled(context.items),
    items: context.items,
    orientation: context.orientation ?? "horizontal",
    activationMode: context.activationMode ?? "automatic",
    id: context.id ?? `ds-tabs-${++idCounter}`,
  };
}

/** Id of the tab element for a value. */
export const tabId = (baseId: string, value: string) => `${baseId}-tab-${value}`;

/** Id of the panel element for a value. */
export const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`;
