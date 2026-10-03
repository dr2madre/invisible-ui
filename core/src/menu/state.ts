import { firstEnabled, lastEnabled, nextEnabled, prevEnabled } from "../internal/collection";
import type { MenuContext, MenuEntry, MenuGroup, MenuState, MenuStop, MenuSubmenu } from "./types";

export { firstEnabled, lastEnabled, nextEnabled, prevEnabled };

/** Whether an entry is a separator. */
export const isSeparator = (entry: MenuEntry): entry is { type: "separator" } =>
  "type" in entry && entry.type === "separator";

/** Whether an entry is a named group of items. */
export const isGroup = (entry: MenuEntry): entry is MenuGroup =>
  "type" in entry && entry.type === "group";

/** Whether an entry is a submenu trigger. */
export const isSubmenu = (entry: MenuEntry): entry is MenuSubmenu =>
  "type" in entry && entry.type === "submenu";

/**
 * The stops the user can move through within one level, in order, with groups
 * flattened. A submenu trigger is a stop; its own items are not, they belong
 * to the next level. Separators and group labels are not stops.
 */
export function itemsOf(entries: MenuEntry[]): MenuStop[] {
  const out: MenuStop[] = [];
  for (const entry of entries) {
    if (isSeparator(entry)) continue;
    if (isGroup(entry)) out.push(...entry.items);
    else out.push(entry);
  }
  return out;
}

/**
 * Whether a stop takes no focus and does nothing: it is disabled, or it is a
 * submenu with no enabled stop, so no key opens an empty level.
 */
export function isStopDisabled(stop: MenuStop): boolean {
  if (stop.disabled) return true;
  return isSubmenu(stop) && !itemsOf(stop.items).some((child) => !isStopDisabled(child));
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
    openPath: [],
  };
}

/** Id of the trigger (menu button) element. */
export const triggerId = (baseId: string) => `${baseId}-trigger`;
/** Id of the menu popup. */
export const menuId = (baseId: string) => `${baseId}-menu`;
/** Id of a menu item element, submenu triggers included, by value. */
export const itemId = (baseId: string, value: string) => `${baseId}-item-${value}`;
/** Id of the submenu a trigger opens, by the trigger's value. */
export const submenuId = (baseId: string, value: string) => `${baseId}-submenu-${value}`;
/**
 * Id of a group's label element, so the group can be named by it. `index` is
 * the group's place among its level's entries; a group inside a submenu also
 * names that submenu, so two levels never share an id.
 */
export const groupLabelId = (baseId: string, index: number, submenu?: string) =>
  submenu == null ? `${baseId}-group-${index}` : `${submenuId(baseId, submenu)}-group-${index}`;

/** The visible text of a stop (its label, falling back to the value). */
export const labelOf = (item: MenuStop) => item.label ?? item.value;

/**
 * Pure typeahead matcher: the value of the next enabled stop whose label
 * starts with `query` (case-insensitive), searching after `fromValue` and
 * wrapping. It searches one level: pass the entries of the level that has
 * focus (`entriesAt(items, path)`, or `api.entriesAt(path)`). A submenu trigger is a match target; the
 * match never opens it.
 */
export function matchItem(
  entries: MenuEntry[],
  query: string,
  fromValue: string | null,
): string | null {
  if (!query) return null;
  const q = query.toLowerCase();
  const enabled = itemsOf(entries).filter((item) => !isStopDisabled(item));
  if (enabled.length === 0) return null;

  const start = enabled.findIndex((item) => item.value === fromValue);
  for (let i = 1; i <= enabled.length; i++) {
    const item = enabled[(start + i + enabled.length) % enabled.length];
    if (item && labelOf(item).toLowerCase().startsWith(q)) return item.value;
  }
  return null;
}
