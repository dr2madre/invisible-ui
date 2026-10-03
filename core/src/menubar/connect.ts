import { identityNormalize, type ElementProps, type Normalize } from "../types";
import type { MenubarState } from "./types";

/** The public, framework-agnostic API for a connected menubar. */
export interface MenubarApi {
  focusedIndex: number;
  openIndex: number;
  /**
   * Open the top menu at `index` and close the one open before, with every
   * level of it. A disabled menu stays closed and its trigger takes focus.
   */
  openAt(index: number): void;
  /**
   * Go to the next (`1`) or previous (`-1`) top menu in visual order, wrapping:
   * it switches the open menu, or moves focus between triggers while every
   * menu is closed.
   */
  move(delta: 1 | -1): void;
  /** Props for the bar (`role="menubar"`), with the keys that move between top menus. */
  menubarProps: ElementProps;
  /** Props the bar adds to a top menu's trigger, beside the menu's own trigger props. */
  getTriggerProps(index: number): ElementProps;
}

export interface ConnectOptions {
  state: MenubarState;
  /** Request a new tab stop among the triggers. */
  setFocusedIndex: (index: number) => void;
  /** Open the top menu at `index`, focusing its first item (the menu's `openMenu("first")`). */
  openMenu: (index: number) => void;
  /** Close the top menu at `index` with every level of it (the menu's `closeMenu()`). */
  closeMenu: (index: number) => void;
  /** Move DOM focus to the trigger at `index`. */
  focusTrigger: (index: number) => void;
  /**
   * Reading direction. Defaults to `"ltr"`. In right-to-left text ArrowLeft
   * goes to the next top menu and ArrowRight to the previous one, so the keys
   * keep following the visual order.
   */
  direction?: "ltr" | "rtl";
  normalize?: Normalize;
}

/**
 * Connect menubar state to prop getters following the WAI-ARIA menubar
 * pattern (https://www.w3.org/WAI/ARIA/apg/patterns/menubar/). The bar acts on
 * a left or right arrow only when the open menu left it unhandled
 * (`event.defaultPrevented` false): the menu takes the arrow toward inline-end
 * on a submenu trigger and the arrow toward inline-start inside a submenu, and
 * leaves the rest to the bar. Each menu's popup must sit inside the element
 * that carries `menubarProps`, or the event must otherwise reach its handler
 * after the menu's own.
 */
export function connect({
  state,
  setFocusedIndex,
  openMenu,
  closeMenu,
  focusTrigger,
  direction = "ltr",
  normalize = identityNormalize,
}: ConnectOptions): MenubarApi {
  const { menus, openIndex } = state;
  const count = menus.length;
  const focusedIndex = Math.max(0, Math.min(state.focusedIndex, count - 1));

  const focusAt = (index: number) => {
    setFocusedIndex(index);
    focusTrigger(index);
  };

  const openAt = (index: number) => {
    const menu = menus[index];
    if (!menu) return;
    if (openIndex !== -1 && openIndex !== index) closeMenu(openIndex);
    if (menu.disabled) {
      focusAt(index);
      return;
    }
    setFocusedIndex(index);
    if (openIndex !== index) openMenu(index);
  };

  const move = (delta: 1 | -1) => {
    if (count === 0) return;
    const from = openIndex !== -1 ? openIndex : focusedIndex;
    const next = (from + delta + count) % count;
    if (openIndex !== -1) openAt(next);
    else focusAt(next);
  };

  const forward = direction === "rtl" ? -1 : 1;

  const onKeyDown = (event: Event) => {
    // The open menu took the key (a submenu opened or closed): leave it.
    if (event.defaultPrevented || count === 0) return;
    const key = (event as KeyboardEvent).key;
    switch (key) {
      case "ArrowRight":
      case "ArrowLeft":
        event.preventDefault();
        move(key === "ArrowRight" ? forward : (-forward as 1 | -1));
        break;
      // Home and End move between triggers only while every menu is closed;
      // an open menu uses them to jump between its own items.
      case "Home":
      case "End":
        if (openIndex === -1) {
          event.preventDefault();
          focusAt(key === "Home" ? 0 : count - 1);
        }
        break;
    }
  };

  return {
    focusedIndex,
    openIndex,
    openAt,
    move,
    menubarProps: normalize({
      role: "menubar",
      "aria-orientation": "horizontal",
      onKeyDown,
    }),
    getTriggerProps: (index: number) =>
      normalize({
        role: "menuitem",
        tabindex: index === focusedIndex ? 0 : -1,
        "data-value": menus[index]?.value,
        onFocus: () => {
          if (index !== focusedIndex) setFocusedIndex(index);
        },
        // Hover switches the open menu, only while another one is open.
        onPointerEnter: () => {
          if (openIndex !== -1 && openIndex !== index) openAt(index);
        },
      }),
  };
}
