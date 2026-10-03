/**
 * A menubar: a horizontal bar of menu triggers (WAI-ARIA menubar pattern), the
 * shape an application menu takes (File, Edit, View). Each top menu is a
 * `menu` machine of its own; this module coordinates them: the roving tab
 * stop across the triggers, one open menu at a time, the left and right
 * arrows between top menus and into submenus, and right-to-left mirroring.
 */

/** What the bar needs to know about one top menu. */
export interface MenubarMenuRef {
  /** Stable value identifying the menu. */
  value: string;
  /** A disabled menu takes focus on its trigger but never opens. */
  disabled?: boolean;
}

/** Resolved state of a menubar. */
export interface MenubarState {
  /** The top menus, in the order shown. */
  menus: MenubarMenuRef[];
  /** Index of the trigger that is the tab stop (roving tabindex). */
  focusedIndex: number;
  /** Index of the open top menu, or `-1` while every menu is closed. */
  openIndex: number;
}
