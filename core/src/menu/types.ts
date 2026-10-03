/**
 * A menu: the button-triggered actions menu (WAI-ARIA menu button pattern): a
 * trigger with `aria-haspopup="menu"` opens a `role="menu"` of `role="menuitem"`
 * actions. Unlike a select, items are *actions* (no persistent selection): the
 * menu opens, the user moves through items, activating one closes the menu, then runs it
 * the menu. DOM focus moves into the menu (roving), so positioning and focus
 * movement are DOM concerns owned by the adapter, not this pure-state primitive.
 */

/**
 * What an item does when the user activates it: run an action (the default),
 * turn something on or off, or pick one option out of a set.
 */
export type MenuItemKind = "action" | "checkbox" | "radio";

/** An actionable item in a menu. */
export interface MenuItem {
  value: string;
  /** Visible label; used for typeahead. Falls back to `value`. */
  label?: string;
  disabled?: boolean;
  /** Defaults to `"action"`. */
  kind?: MenuItemKind;
  /**
   * On/off state for a `checkbox` or `radio` item. The menu reports the
   * activation and the application decides what the new state is, the same way
   * every other control here works.
   */
  checked?: boolean;
}

/** A line that separates groups of items. It is not focusable. */
export interface MenuSeparator {
  type: "separator";
}

/** A named set of items, announced as a group with its label. */
export interface MenuGroup {
  type: "group";
  /** Visible label naming the group. */
  label: string;
  items: (MenuItem | MenuSubmenu)[];
}

/**
 * An item that opens a nested menu beside it. It never reports through
 * `onSelect`: opening and closing it is internal to the menu.
 */
export interface MenuSubmenu {
  type: "submenu";
  /**
   * Identity: the trigger's id, its place in the open path and the typeahead
   * target. Unique across the whole tree, like every item value.
   */
  value: string;
  /** Visible label; the accessible name and the typeahead text. */
  label: string;
  /** A disabled trigger opens by no key, hover or press. */
  disabled?: boolean;
  /** Items, separators, groups and further submenus, in the order shown. */
  items: MenuEntry[];
  /**
   * A submenu trigger is never checkable. Declared so code that reads `kind`
   * or `checked` on any stop keeps compiling.
   */
  kind?: never;
  checked?: never;
}

/**
 * A stop the user can move to within one level: an item or a submenu trigger.
 */
export type MenuStop = MenuItem | MenuSubmenu;

/**
 * Everything a menu can hold. A bare {@link MenuItem} is still valid on its
 * own, so a plain list of actions needs no change.
 */
export type MenuEntry = MenuItem | MenuSeparator | MenuGroup | MenuSubmenu;

/** Internal, fully-resolved state of a menu. */
export interface MenuState {
  /** Whether the menu popup is open. */
  open: boolean;
  /** The active (focused) item value, or `null`. */
  activeValue: string | null;
  /** Everything the menu holds, in the order it is shown. */
  items: MenuEntry[];
  /** Whether the whole menu is disabled. */
  disabled: boolean;
  /** Base id used to link the trigger and menu. */
  id: string;
  /**
   * Values of the open submenu triggers, from the root menu outward. Empty, or
   * left out, while only the root menu is open. A value that is no longer an
   * enabled submenu of the items cuts the path there, silently.
   */
  openPath?: string[];
}

/** User-provided options when creating a menu. */
export interface MenuContext {
  /** Items, separators, groups and submenus, in the order they are shown. */
  items: MenuEntry[];
  disabled?: boolean;
  id?: string;
  /** Called when an item is activated (selected/clicked). */
  onSelect?: (value: string) => void;
  /** Called whenever the root menu opens or closes; submenus report nothing. */
  onOpenChange?: (open: boolean) => void;
}
