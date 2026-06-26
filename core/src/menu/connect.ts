import { identityNormalize, type ElementProps, type Normalize } from "../types";
import {
  firstEnabled,
  itemId,
  lastEnabled,
  menuId,
  nextEnabled,
  prevEnabled,
  triggerId,
} from "./state";
import type { MenuState } from "./types";

/** The public, framework-agnostic API for a connected menu. */
export interface MenuApi {
  open: boolean;
  activeValue: string | null;
  /** Open the menu, focusing the first enabled item. */
  openMenu(from?: "first" | "last"): void;
  /** Close the menu. */
  closeMenu(): void;
  /** Make an item active (focused). */
  setActive(value: string): void;
  /** Activate an item (runs onSelect) and close (ignored when disabled). */
  select(value: string): void;
  /** Props for the trigger button (`aria-haspopup="menu"`). */
  triggerProps: ElementProps;
  /** Props for the menu popup (`role="menu"`). */
  menuProps: ElementProps;
  /** Props for a menu item, by value (`role="menuitem"`). */
  getItemProps(value: string): ElementProps;
}

export interface ConnectOptions {
  state: MenuState;
  /** Request the open state to change; the adapter owns how state updates. */
  setOpen: (open: boolean) => void;
  /** Request a new active value. */
  setActiveValue: (value: string | null) => void;
  /** Run the item's action. */
  onSelect?: (value: string) => void;
  normalize?: Normalize;
}

/**
 * Connect menu state to prop getters following the WAI-ARIA menu button pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/). DOM focus moves into
 * the menu (the adapter focuses the active item); Escape/Tab close and return
 * focus to the trigger. Items are actions — activating one runs it and closes.
 */
export function connect({
  state,
  setOpen,
  setActiveValue,
  onSelect,
  normalize = identityNormalize,
}: ConnectOptions): MenuApi {
  const { open, activeValue, items, disabled, id } = state;

  const isItemDisabled = (v: string) => items.find((i) => i.value === v)?.disabled ?? false;

  const openMenu = (from: "first" | "last" = "first") => {
    if (disabled || open) return;
    setActiveValue(from === "first" ? firstEnabled(items) : lastEnabled(items));
    setOpen(true);
  };

  const closeMenu = () => {
    if (!open) return;
    setOpen(false);
    setActiveValue(null);
  };

  const select = (v: string) => {
    if (disabled || isItemDisabled(v)) return;
    onSelect?.(v);
    closeMenu();
  };

  const move = (target: string | null) => {
    if (target != null) setActiveValue(target);
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

  const onMenuKeyDown = (event: Event) => {
    const key = (event as KeyboardEvent).key;
    switch (key) {
      case "ArrowDown":
        event.preventDefault();
        move(nextEnabled(items, activeValue));
        break;
      case "ArrowUp":
        event.preventDefault();
        move(prevEnabled(items, activeValue));
        break;
      case "Home":
        event.preventDefault();
        move(firstEnabled(items));
        break;
      case "End":
        event.preventDefault();
        move(lastEnabled(items));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (activeValue != null) select(activeValue);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu();
        break;
    }
  };

  return {
    open,
    activeValue,
    openMenu,
    closeMenu,
    setActive: (v: string) => setActiveValue(v),
    select,
    triggerProps: normalize({
      id: triggerId(id),
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? menuId(id) : undefined,
      "aria-disabled": disabled || undefined,
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
      onKeyDown: onMenuKeyDown,
    }),
    getItemProps: (v: string) => {
      const itemDisabled = isItemDisabled(v);
      const active = activeValue === v;
      return normalize({
        id: itemId(id, v),
        role: "menuitem",
        tabindex: -1,
        "aria-disabled": itemDisabled || undefined,
        "data-active": active ? "" : undefined,
        "data-disabled": itemDisabled ? "" : undefined,
        "data-value": v,
        onClick: () => select(v),
        onMouseEnter: () => {
          if (!itemDisabled) setActiveValue(v);
        },
      });
    },
  };
}
