import { firstEnabled, lastEnabled, nextEnabled, prevEnabled } from "../internal/collection";
import type { MenuEntry, MenuContext, MenuGroup, MenuItem, MenuState } from "./types";

export { firstEnabled, lastEnabled, nextEnabled, prevEnabled };

/** Whether an entry is a separator. */
export const isSeparator = (entry: MenuEntry): entry is { type: "separator" } =>
  "type" in entry && entry.type === "separator";

/** Whether an entry is a named group of items. */
export const isGroup = (entry: MenuEntry): entry is MenuGroup =>
  "type" in entry && entry.type === "group";

/**
 * The items the user can move through, in order, with groups flattened.
 * Separators and group labels are not stops.
 */
export function itemsOf(entries: MenuEntry[]): MenuItem[] {
  const out: MenuItem[] = [];
  for (const entry of entries) {
    if (isSeparator(entry)) continue;
    if (isGroup(entry)) out.push(...entry.items);
    else out.push(entry);
  }
  return out;
}

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: MenuContext): MenuState {
  return {
    open: false,
    activeValue: null,
    items: context.items,
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-menu-${++idCounter}`,
  };
}

/** Id of the trigger (menu button) element. */
export const triggerId = (baseId: string) => `${baseId}-trigger`;
/** Id of the menu popup. */
export const menuId = (baseId: string) => `${baseId}-menu`;
/** Id of a menu item element, by value. */
export const itemId = (baseId: string, value: string) => `${baseId}-item-${value}`;
/** Id of a group's label element, so the group can be named by it. */
export const groupLabelId = (baseId: string, index: number) => `${baseId}-group-${index}`;

/** The visible text of an item (its label, falling back to the value). */
export const labelOf = (item: MenuItem) => item.label ?? item.value;

/**
 * Pure typeahead matcher: the value of the next enabled item whose label starts
 * with `query` (case-insensitive), searching after `fromValue` and wrapping.
 */
export function matchItem(
  entries: MenuEntry[],
  query: string,
  fromValue: string | null,
): string | null {
  if (!query) return null;
  const q = query.toLowerCase();
  const enabled = itemsOf(entries).filter((item) => !item.disabled);
  if (enabled.length === 0) return null;

  const start = enabled.findIndex((item) => item.value === fromValue);
  for (let i = 1; i <= enabled.length; i++) {
    const item = enabled[(start + i + enabled.length) % enabled.length];
    if (item && labelOf(item).toLowerCase().startsWith(q)) return item.value;
  }
  return null;
}
