import { DEV } from "../internal/dev";
import { isStopDisabled, isSubmenu, itemsOf } from "./state";
import type { MenuEntry, MenuStop, MenuSubmenu } from "./types";

/**
 * Walking a menu tree: finding a stop and its path, the entries of a level,
 * the part of an open path that still holds, and the development checks.
 * `findEntry` and `entriesAt` are public; the rest serves `connect`.
 */

/**
 * A stop found in the tree. `path` holds the values of the submenus that
 * contain it, from the root outward: `[]` for a stop of the root menu.
 */
export interface MenuEntryLocation {
  entry: MenuStop;
  path: string[];
}

/** Visit every stop of the tree, depth first, with the path that leads to it. */
function walkTree(entries: MenuEntry[], visit: (stop: MenuStop, path: string[]) => void): void {
  const walk = (level: MenuEntry[], path: string[]) => {
    for (const stop of itemsOf(level)) {
      visit(stop, path);
      if (isSubmenu(stop)) walk(stop.items, [...path, stop.value]);
    }
  };
  walk(entries, []);
}

/** Every stop of the tree by value; with a repeated value the first one wins. */
export function indexEntries(entries: MenuEntry[]): Map<string, MenuEntryLocation> {
  const index = new Map<string, MenuEntryLocation>();
  walkTree(entries, (entry, path) => {
    if (!index.has(entry.value)) index.set(entry.value, { entry, path });
  });
  return index;
}

/**
 * Find an item or submenu trigger anywhere in the tree, with the path of the
 * submenus that contain it.
 */
export const findEntry = (entries: MenuEntry[], value: string): MenuEntryLocation | null =>
  indexEntries(entries).get(value) ?? null;

/** Follow `path` level by level while each value is a submenu `canOpen` accepts. */
function followPath(
  entries: MenuEntry[],
  path: readonly string[],
  canOpen: (submenu: MenuSubmenu) => boolean,
): { opened: string[]; level: MenuEntry[] } {
  const opened: string[] = [];
  let level = entries;
  for (const value of path) {
    const stop = itemsOf(level).find((s) => s.value === value);
    if (!stop || !isSubmenu(stop) || !canOpen(stop)) break;
    opened.push(value);
    level = stop.items;
  }
  return { opened, level };
}

/**
 * The entries of the level a path of submenu values opens: the root entries
 * for `[]`. A path that does not lead through submenus gives `[]`.
 */
export function entriesAt(entries: MenuEntry[], path: readonly string[]): MenuEntry[] {
  const { opened, level } = followPath(entries, path, () => true);
  return opened.length === path.length ? level : [];
}

/**
 * The part of an open path that still holds: it is cut at the first value
 * that is gone, is not a submenu, or cannot open (disabled or empty).
 */
export const resolveOpenPath = (entries: MenuEntry[], path: readonly string[]): string[] =>
  followPath(entries, path, (submenu) => !isStopDisabled(submenu)).opened;

/** The stops of one level, each with the disabled state navigation uses. */
export const navigableStops = (entries: MenuEntry[]) =>
  itemsOf(entries).map((stop) => ({ value: stop.value, disabled: isStopDisabled(stop) }));

/** Submenus nested deeper than this many levels below the root get a warning. */
const RECOMMENDED_DEPTH = 2;

const checked = new WeakSet<MenuEntry[]>();

/**
 * Development checks on a menu tree, run once per items array: a value used
 * twice anywhere in the tree throws, because `onSelect` reports values and
 * element ids are built from them; a submenu nested more than two levels below
 * the root warns. Production builds skip both, and the first stop with a
 * repeated value wins.
 */
export function checkItems(entries: MenuEntry[]): void {
  if (!DEV || checked.has(entries)) return;
  const seen = new Set<string>();
  walkTree(entries, (stop, path) => {
    if (seen.has(stop.value)) {
      throw new Error(`[ds] Menu value "${stop.value}" appears more than once in the menu tree.`);
    }
    seen.add(stop.value);
    const depth = path.length + 1;
    if (isSubmenu(stop) && depth > RECOMMENDED_DEPTH) {
      console.warn(
        `[ds] Submenu "${stop.value}" opens ${depth} levels below the root menu; one level is recommended.`,
      );
    }
  });
  checked.add(entries);
}
