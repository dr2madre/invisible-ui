/**
 * A menu — the button-triggered actions menu (WAI-ARIA menu button pattern): a
 * trigger with `aria-haspopup="menu"` opens a `role="menu"` of `role="menuitem"`
 * actions. Unlike a select, items are *actions* (no persistent selection): the
 * menu opens, the user moves through items, activating one runs it and closes
 * the menu. DOM focus moves into the menu (roving), so positioning and focus
 * movement are DOM concerns owned by the adapter, not this pure-state primitive.
 */

/** An actionable item in a menu. */
export interface MenuItem {
  value: string;
  /** Visible label; used for typeahead. Falls back to `value`. */
  label?: string;
  disabled?: boolean;
}

/** Internal, fully-resolved state of a menu. */
export interface MenuState {
  /** Whether the menu popup is open. */
  open: boolean;
  /** The active (focused) item value, or `null`. */
  activeValue: string | null;
  items: MenuItem[];
  /** Whether the whole menu is disabled. */
  disabled: boolean;
  /** Base id used to link the trigger and menu. */
  id: string;
}

/** User-provided options when creating a menu. */
export interface MenuContext {
  items: MenuItem[];
  disabled?: boolean;
  id?: string;
  /** Called when an item is activated (selected/clicked). */
  onSelect?: (value: string) => void;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}
