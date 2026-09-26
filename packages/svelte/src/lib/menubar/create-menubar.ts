import type { Action } from "svelte/action";
import { get, writable, type Readable } from "svelte/store";
import {
  createDropdownMenu,
  type CreateDropdownMenu,
  type MenuItem,
} from "../dropdown-menu/create-dropdown-menu";

export type { MenuItem };

/** One top-level menu in a menubar. */
export interface MenubarMenu {
  /** Stable value identifying this menu (passed to `onSelect`). */
  value: string;
  /** Visible trigger label. */
  label: string;
  /** The menu's actionable items. */
  items: MenuItem[];
  /** Disable the whole menu. */
  disabled?: boolean;
}

export interface MenubarContext {
  menus: MenubarMenu[];
  /** Called when an item is activated, with its menu and item values. */
  onSelect?: (menuValue: string, itemValue: string) => void;
}

/** A menu wired for rendering: config plus its part actions and open state. */
export interface MenubarItem extends MenubarMenu {
  open: Readable<boolean>;
  /** Action for this menu's trigger button. */
  triggerAction: Action<HTMLElement>;
  /** Action for this menu's popup. */
  menuAction: Action<HTMLElement>;
  /** Action for a menu item: `use:itemAction={value}`. */
  itemAction: Action<HTMLElement, string>;
}

export interface CreateMenubar {
  /** Index of the trigger that is the current tab stop (roving tabindex). */
  focusedIndex: Readable<number>;
  /** Action for the `role="menubar"` container (cross-menu keyboard nav). */
  menubarAction: Action<HTMLElement>;
  /** The menus, each ready to render. */
  menus: Readable<MenubarItem[]>;
  /**
   * Reflect controlled menus without reporting a change. A menu keeps its
   * state (open, active item) across a sync as long as its value stays.
   */
  syncMenus: (menus: MenubarMenu[]) => void;
}

/**
 * Create a headless menubar (WAI-ARIA menubar pattern). Each top-level menu
 * reuses {@link createDropdownMenu} (positioning, roving focus into the menu,
 * typeahead, outside-press close); this layer adds the menubar coordination:
 * roving tabindex across the triggers, ArrowLeft/Right to move between triggers
 * (or, when a menu is open, to switch the open menu), Home/End, hover-to-switch
 * while open, and "only one menu open at a time".
 */
export function createMenubar(context: MenubarContext): CreateMenubar {
  // The current menus, each with its dropdown machine. Everything below reads
  // this list at call time, so a sync reaches the keyboard coordination too.
  let entries: { menu: MenubarMenu; dropdown: CreateDropdownMenu }[] = [];
  const count = () => entries.length;
  const dropdownAt = (i: number) => entries[i]!.dropdown;
  const indexOf = (value: string) => entries.findIndex((entry) => entry.menu.value === value);

  const focusedIndex = writable(0);
  // Trigger elements by menu value, so a reorder keeps each one with its menu.
  const triggerEls = new Map<string, HTMLElement>();

  const openIndex = () => entries.findIndex((entry) => get(entry.dropdown.open));
  const closeAllExcept = (keep: number) =>
    entries.forEach(({ dropdown }, i) => {
      if (i !== keep && get(dropdown.open)) get(dropdown.api).closeMenu();
    });
  const openAt = (i: number) => {
    closeAllExcept(i);
    get(dropdownAt(i).api).openMenu("first");
  };
  const focusTrigger = (i: number) => {
    focusedIndex.set(i);
    triggerEls.get(entries[i]!.menu.value)?.focus();
  };
  const move = (from: number, dir: 1 | -1) => {
    const n = count();
    const next = (from + dir + n) % n;
    focusedIndex.set(next);
    if (openIndex() !== -1) openAt(next);
    else focusTrigger(next);
  };

  const menubarAction: Action<HTMLElement> = (node) => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (count() === 0) return;
      const open = openIndex();
      const from = open !== -1 ? open : get(focusedIndex);
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          move(from, 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          move(from, -1);
          break;
        // Home/End move between triggers only while closed; an open menu uses
        // them to jump items (handled by the menu itself).
        case "Home":
          if (open === -1) {
            event.preventDefault();
            focusTrigger(0);
          }
          break;
        case "End":
          if (open === -1) {
            event.preventDefault();
            focusTrigger(count() - 1);
          }
          break;
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return { destroy: () => node.removeEventListener("keydown", onKeyDown) };
  };

  // One dropdown and one trigger action per menu value, created on first
  // sight and reused while the value stays, so a rendered menu is never torn
  // down by a sync.
  const cache = new Map<
    string,
    { dropdown: CreateDropdownMenu; triggerAction: Action<HTMLElement> }
  >();
  const create = (menu: MenubarMenu) => {
    const { value } = menu;
    const dropdown = createDropdownMenu({
      items: menu.items,
      disabled: menu.disabled,
      onSelect: (itemValue) => context.onSelect?.(value, itemValue),
    });
    const triggerAction: Action<HTMLElement> = (node) => {
      triggerEls.set(value, node);
      const base = dropdown.triggerAction(node);

      const onFocus = () => focusedIndex.set(indexOf(value));
      // Hover switches the open menu (only while another menu is already open).
      const onPointerEnter = () => {
        const open = openIndex();
        const i = indexOf(value);
        if (open !== -1 && open !== i) openAt(i);
      };
      node.addEventListener("focus", onFocus);
      node.addEventListener("pointerenter", onPointerEnter);

      return {
        destroy() {
          node.removeEventListener("focus", onFocus);
          node.removeEventListener("pointerenter", onPointerEnter);
          if (triggerEls.get(value) === node) triggerEls.delete(value);
          base?.destroy?.();
        },
      };
    };
    return { dropdown, triggerAction };
  };

  const menus = writable<MenubarItem[]>([]);
  let lastMenus: MenubarMenu[] | null = null;
  const syncMenus = (next: MenubarMenu[]) => {
    if (next === lastMenus) return;
    lastMenus = next;
    const seen = new Set<string>();
    entries = next.map((menu) => {
      seen.add(menu.value);
      let cached = cache.get(menu.value);
      if (cached) {
        cached.dropdown.syncItems(menu.items);
        cached.dropdown.syncDisabled(menu.disabled ?? false);
      } else {
        cached = create(menu);
        cache.set(menu.value, cached);
      }
      return { menu, dropdown: cached.dropdown };
    });
    for (const value of [...cache.keys()]) if (!seen.has(value)) cache.delete(value);
    // The tab stop stays on the bar when the menu holding it goes away.
    focusedIndex.update((i) => Math.max(0, Math.min(i, next.length - 1)));
    menus.set(
      next.map((menu) => {
        const { dropdown, triggerAction } = cache.get(menu.value)!;
        return {
          ...menu,
          open: dropdown.open,
          triggerAction,
          menuAction: dropdown.menuAction,
          itemAction: dropdown.itemAction,
        };
      }),
    );
  };
  syncMenus(context.menus);

  return { focusedIndex, menubarAction, menus, syncMenus };
}
