import type { Action } from "svelte/action";
import { get, writable, type Readable } from "svelte/store";
import { createDropdownMenu, type MenuItem } from "../dropdown-menu/create-dropdown-menu";

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
  menus: MenubarItem[];
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
  const { menus } = context;
  const n = menus.length;

  const dropdowns = menus.map((menu) =>
    createDropdownMenu({
      items: menu.items,
      disabled: menu.disabled,
      onSelect: (itemValue) => context.onSelect?.(menu.value, itemValue),
    }),
  );

  const focusedIndex = writable(0);
  const triggerEls: (HTMLElement | null)[] = Array(n).fill(null);

  const openIndex = () => dropdowns.findIndex((d) => get(d.open));
  const closeAllExcept = (keep: number) =>
    dropdowns.forEach((d, i) => {
      if (i !== keep && get(d.open)) get(d.api).closeMenu();
    });
  const openAt = (i: number) => {
    closeAllExcept(i);
    get(dropdowns[i]!.api).openMenu("first");
  };
  const focusTrigger = (i: number) => {
    focusedIndex.set(i);
    triggerEls[i]?.focus();
  };
  const move = (from: number, dir: 1 | -1) => {
    const next = (from + dir + n) % n;
    focusedIndex.set(next);
    if (openIndex() !== -1) openAt(next);
    else focusTrigger(next);
  };

  const menubarAction: Action<HTMLElement> = (node) => {
    const onKeyDown = (event: KeyboardEvent) => {
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
            focusTrigger(n - 1);
          }
          break;
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return { destroy: () => node.removeEventListener("keydown", onKeyDown) };
  };

  const menus_: MenubarItem[] = menus.map((menu, i) => {
    const dropdown = dropdowns[i]!;
    const triggerAction: Action<HTMLElement> = (node) => {
      triggerEls[i] = node;
      const base = dropdown.triggerAction(node);

      const onFocus = () => focusedIndex.set(i);
      // Hover switches the open menu (only while another menu is already open).
      const onPointerEnter = () => {
        const open = openIndex();
        if (open !== -1 && open !== i) openAt(i);
      };
      node.addEventListener("focus", onFocus);
      node.addEventListener("pointerenter", onPointerEnter);

      return {
        destroy() {
          node.removeEventListener("focus", onFocus);
          node.removeEventListener("pointerenter", onPointerEnter);
          if (triggerEls[i] === node) triggerEls[i] = null;
          base?.destroy?.();
        },
      };
    };

    return {
      ...menu,
      open: dropdown.open,
      triggerAction,
      menuAction: dropdown.menuAction,
      itemAction: dropdown.itemAction,
    };
  });

  return { focusedIndex, menubarAction, menus: menus_ };
}
