import { identityNormalize, type ElementProps, type Normalize } from "../types";
import {
  firstEnabled,
  groupLabelId,
  isStopDisabled,
  isSubmenu,
  itemId,
  lastEnabled,
  menuId,
  nextEnabled,
  prevEnabled,
  submenuId,
  triggerId,
} from "./state";
import {
  checkItems,
  entriesAt,
  indexEntries,
  navigableStops,
  resolveOpenPath,
  type MenuEntryLocation,
} from "./tree";
import type { MenuEntry, MenuState } from "./types";

/** The public, framework-agnostic API for a connected menu. */
export interface MenuApi {
  open: boolean;
  activeValue: string | null;
  /**
   * Values of the open submenu triggers, from the root menu outward, cut at
   * any value the items no longer hold. `[]` while only the root menu is open.
   */
  openPath: string[];
  /** Open the menu, focusing the first enabled item. */
  openMenu(from?: "first" | "last"): void;
  /** Close the menu and every open submenu. */
  closeMenu(): void;
  /** Make an item active (focused). */
  setActive(value: string): void;
  /**
   * Activate an item: close every level, then run onSelect. Ignored for a
   * disabled item and for a submenu trigger, which never reports.
   */
  select(value: string): void;
  /**
   * Open a submenu and the submenus that contain it, closing any other open
   * submenu of the same level. `"first"` (keys) focuses its first enabled
   * item; `"none"` (hover) leaves focus where it is. A disabled or empty
   * submenu does not open.
   */
  openSubmenu(value: string, focus?: "first" | "none"): void;
  /** Close the deepest open submenu and make its trigger active. */
  closeSubmenu(): void;
  /** The entries of the level a path of submenu values opens (`[]` is the root). */
  entriesAt(path: readonly string[]): MenuEntry[];
  /** The level an item or submenu trigger sits on: 0 for the root menu, -1 when absent. */
  levelOf(value: string): number;
  /** An item or submenu trigger with the path of the submenus that contain it. */
  findEntry(value: string): MenuEntryLocation | null;
  /** Props for the trigger button (`aria-haspopup="menu"`). */
  triggerProps: ElementProps;
  /**
   * Props for the root menu popup (`role="menu"`). Its key handler serves
   * every level: submenu popups stay DOM descendants of this element, so
   * their keys bubble to it.
   */
  menuProps: ElementProps;
  /** Props for a menu item, by value (`role="menuitem"`); a submenu trigger gets its own props. */
  getItemProps(value: string): ElementProps;
  /** Props for a submenu trigger (`aria-haspopup="menu"`, `aria-expanded`). */
  getSubmenuTriggerProps(value: string): ElementProps;
  /** Props for the popup of a submenu, by its trigger's value (`role="menu"`). */
  getSubmenuProps(value: string): ElementProps;
  /** Props for a separator line between groups of items. */
  separatorProps: ElementProps;
  /** Props for a group wrapper, named by its label; `submenu` names the level it sits in. */
  getGroupProps(index: number, submenu?: string): ElementProps;
  /** Props for the element holding a group's label text. */
  getGroupLabelProps(index: number, submenu?: string): ElementProps;
}

export interface ConnectOptions {
  state: MenuState;
  /** Request the root menu's open state to change; the adapter owns how state updates. */
  setOpen: (open: boolean) => void;
  /** Request a new active value. */
  setActiveValue: (value: string | null) => void;
  /**
   * Request a new open path. Submenu state is internal: the adapter stores it
   * and reports nothing. Without it, submenus never open.
   */
  setOpenPath?: (path: string[]) => void;
  /** Run the item's action. */
  onSelect?: (value: string) => void;
  /**
   * Reading direction. Defaults to `"ltr"`. In right-to-left text ArrowLeft
   * opens a submenu and ArrowRight closes one, so they keep following the
   * visual side a submenu opens on.
   */
  direction?: "ltr" | "rtl";
  normalize?: Normalize;
}

const sameValues = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

// A click event says which kind of pointer pressed; a call without an event,
// or a keyboard-made click, reads as a mouse.
const isTouchOrPen = (event?: Event) => {
  const type = (event as PointerEvent | undefined)?.pointerType;
  return type === "touch" || type === "pen";
};

/**
 * Connect menu state to prop getters following the WAI-ARIA menu button and
 * menu patterns (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/,
 * https://www.w3.org/WAI/ARIA/apg/patterns/menubar/). DOM focus moves into
 * the menu (the adapter focuses the active item). Arrow keys, Home, End and
 * typeahead move within the level that has focus; Enter, Space and the arrow
 * toward inline-end open a submenu; the arrow toward inline-start and Escape
 * close one level; Tab closes every level. Activating an item closes every
 * level, then reports it (ADR 0011); Space on a checkbox or radio item reports
 * it and keeps the menu open.
 */
export function connect({
  state,
  setOpen,
  setActiveValue,
  setOpenPath,
  onSelect,
  direction = "ltr",
  normalize = identityNormalize,
}: ConnectOptions): MenuApi {
  const { open, activeValue, items, disabled, id } = state;
  checkItems(items);

  const index = indexEntries(items);
  const requestedPath = state.openPath ?? [];
  const path = open ? resolveOpenPath(items, requestedPath) : [];

  const isItemDisabled = (v: string) => {
    const entry = index.get(v)?.entry;
    return entry ? isStopDisabled(entry) : false;
  };
  const isExpanded = (v: string) => path.includes(v);
  const stopsAt = (at: readonly string[]) => navigableStops(entriesAt(items, at));

  const setPath = (next: string[]) => {
    if (!sameValues(next, requestedPath)) setOpenPath?.(next);
  };

  const openMenu = (from: "first" | "last" = "first") => {
    if (disabled || open) return;
    const stops = stopsAt([]);
    setActiveValue(from === "first" ? firstEnabled(stops) : lastEnabled(stops));
    setPath([]);
    setOpen(true);
  };

  const closeMenu = () => {
    if (!open) return;
    setOpen(false);
    setActiveValue(null);
    setPath([]);
  };

  const select = (v: string) => {
    const entry = index.get(v)?.entry;
    if (disabled || !entry || isSubmenu(entry) || isStopDisabled(entry)) return;
    // The menu closes first, then says what was chosen (ADR 0011): a handler
    // that reads the menu sees it closed, and one that opens it again keeps
    // it open.
    closeMenu();
    onSelect?.(v);
  };

  const openSubmenu = (v: string, focus: "first" | "none" = "first") => {
    const located = index.get(v);
    if (!open || disabled || !located) return;
    const { entry } = located;
    if (!isSubmenu(entry) || isStopDisabled(entry)) return;
    setPath([...located.path, v]);
    if (focus === "first") setActiveValue(firstEnabled(navigableStops(entry.items)));
  };

  /** Close the level `scope` opens (and anything deeper), focusing its trigger. */
  const closeLevel = (scope: string[]) => {
    const parent = scope[scope.length - 1];
    if (parent == null) return;
    setPath(scope.slice(0, -1));
    setActiveValue(parent);
  };

  const closeSubmenu = () => closeLevel(path);

  // Enter and a press activate; Space on a checkable item reports the change
  // and keeps every level open, so several options can be set in a row.
  const activate = (v: string, viaSpace: boolean) => {
    const entry = index.get(v)?.entry;
    if (disabled || !entry || isStopDisabled(entry)) return;
    if (isSubmenu(entry)) openSubmenu(v, "first");
    else if (viaSpace && (entry.kind === "checkbox" || entry.kind === "radio")) onSelect?.(v);
    else select(v);
  };

  const onTriggerKeyDown = (event: Event) => {
    const key = (event as KeyboardEvent).key;
    if (key === "ArrowDown" || key === "Enter" || key === " ") {
      event.preventDefault();
      openMenu("first");
    } else if (key === "ArrowUp") {
      event.preventDefault();
      openMenu("last");
    }
  };

  const [openKey, closeKey] =
    direction === "rtl" ? ["ArrowLeft", "ArrowRight"] : ["ArrowRight", "ArrowLeft"];

  const onMenuKeyDown = (event: Event) => {
    const key = (event as KeyboardEvent).key;
    // The level that has focus: the active item's, or the deepest open one.
    const focused = activeValue == null ? undefined : index.get(activeValue);
    const scope = focused ? focused.path : path;
    const stops = stopsAt(scope);
    const handled = () => event.preventDefault();
    // Moving within a level closes the submenus open below it.
    const move = (target: string | null) => {
      if (target == null) return;
      if (path.length > scope.length) setPath(path.slice(0, scope.length));
      setActiveValue(target);
    };

    switch (key) {
      case "ArrowDown":
        handled();
        move(nextEnabled(stops, activeValue));
        break;
      case "ArrowUp":
        handled();
        move(prevEnabled(stops, activeValue));
        break;
      case "Home":
        handled();
        move(firstEnabled(stops));
        break;
      case "End":
        handled();
        move(lastEnabled(stops));
        break;
      case "Enter":
      case " ":
        handled();
        if (activeValue != null) activate(activeValue, key === " ");
        break;
      case openKey:
        // Only a submenu trigger that can open takes it; elsewhere a Menubar may.
        if (
          activeValue != null &&
          focused &&
          isSubmenu(focused.entry) &&
          !isStopDisabled(focused.entry)
        ) {
          handled();
          openSubmenu(activeValue, "first");
        }
        break;
      case closeKey:
        // Only a submenu closes on it; in the root menu a Menubar may take it.
        if (scope.length > 0) {
          handled();
          closeLevel(scope);
        }
        break;
      case "Escape":
        handled();
        if (path.length > scope.length) setPath(scope);
        else if (scope.length > 0) closeLevel(scope);
        else closeMenu();
        break;
      case "Tab":
        closeMenu();
        break;
    }
  };

  const getSubmenuTriggerProps = (v: string) => {
    const located = index.get(v);
    const triggerDisabled = disabled || isItemDisabled(v);
    const expanded = isExpanded(v);
    return normalize({
      id: itemId(id, v),
      role: "menuitem",
      tabindex: -1,
      "aria-haspopup": "menu",
      "aria-expanded": expanded,
      "aria-controls": expanded ? submenuId(id, v) : undefined,
      "aria-disabled": triggerDisabled || undefined,
      "data-active": activeValue === v ? "" : undefined,
      "data-disabled": triggerDisabled ? "" : undefined,
      "data-state": expanded ? "open" : "closed",
      "data-kind": "submenu",
      "data-value": v,
      // A press opens a closed submenu. A mouse press keeps an open one open,
      // since hover has usually opened it a moment before; a touch or pen
      // press closes it (decision 2).
      onClick: (event?: Event) => {
        if (triggerDisabled || !located) return;
        if (!expanded) openSubmenu(v, "none");
        else if (isTouchOrPen(event)) setPath(located.path);
        setActiveValue(v);
      },
      onMouseEnter: () => {
        if (!triggerDisabled) setActiveValue(v);
      },
    });
  };

  return {
    open,
    activeValue,
    openPath: path,
    openMenu,
    closeMenu,
    setActive: (v: string) => setActiveValue(v),
    select,
    openSubmenu,
    closeSubmenu,
    entriesAt: (at: readonly string[]) => entriesAt(items, at),
    levelOf: (v: string) => index.get(v)?.path.length ?? -1,
    findEntry: (v: string) => index.get(v) ?? null,
    triggerProps: normalize({
      id: triggerId(id),
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? menuId(id) : undefined,
      "aria-disabled": disabled || undefined,
      "data-disabled": disabled ? "" : undefined,
      "data-state": open ? "open" : "closed",
      onClick: () => (open ? closeMenu() : openMenu("first")),
      onKeyDown: onTriggerKeyDown,
    }),
    menuProps: normalize({
      id: menuId(id),
      role: "menu",
      "aria-labelledby": triggerId(id),
      tabindex: -1,
      "data-state": open ? "open" : "closed",
      "data-level": 0,
      onKeyDown: onMenuKeyDown,
    }),
    getItemProps: (v: string) => {
      const entry = index.get(v)?.entry;
      if (entry && isSubmenu(entry)) return getSubmenuTriggerProps(v);
      const itemDisabled = isItemDisabled(v);
      const active = activeValue === v;
      const kind = entry?.kind ?? "action";
      const role =
        kind === "checkbox" ? "menuitemcheckbox" : kind === "radio" ? "menuitemradio" : "menuitem";
      return normalize({
        id: itemId(id, v),
        role,
        tabindex: -1,
        // A checkable item always says whether it is on: leaving it out would
        // read as an ordinary action.
        "aria-checked": kind === "action" ? undefined : (entry?.checked ?? false),
        "aria-disabled": itemDisabled || undefined,
        "data-active": active ? "" : undefined,
        "data-disabled": itemDisabled ? "" : undefined,
        "data-checked": kind !== "action" && entry?.checked ? "" : undefined,
        "data-kind": kind,
        "data-value": v,
        onClick: () => select(v),
        onMouseEnter: () => {
          if (!itemDisabled) setActiveValue(v);
        },
      });
    },
    getSubmenuTriggerProps,
    getSubmenuProps: (v: string) => {
      const expanded = isExpanded(v);
      return normalize({
        id: submenuId(id, v),
        role: "menu",
        "aria-labelledby": itemId(id, v),
        tabindex: -1,
        "data-state": expanded ? "open" : "closed",
        "data-level": (index.get(v)?.path.length ?? 0) + 1,
      });
    },
    separatorProps: normalize({ role: "separator" }),
    getGroupProps: (i: number, submenu?: string) =>
      normalize({ role: "group", "aria-labelledby": groupLabelId(id, i, submenu) }),
    getGroupLabelProps: (i: number, submenu?: string) =>
      normalize({ id: groupLabelId(id, i, submenu) }),
  };
}
