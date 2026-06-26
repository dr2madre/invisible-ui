/**
 * A navigation menu — a site-navigation bar where some items reveal a panel of
 * links (Radix "Navigation Menu"). Each panel-item is a disclosure: a trigger
 * with `aria-expanded` / `aria-controls` over a content panel; at most one panel
 * is open. Hover timing, positioning and dismissal are DOM concerns owned by the
 * adapter — this pure primitive owns the open value and the ARIA wiring.
 */

export interface NavigationMenuState {
  /** The value of the currently open item, or `null`. */
  value: string | null;
  /** Base id used to link triggers and content panels. */
  id: string;
}

export interface NavigationMenuContext {
  /** Initial / controlled open value. Defaults to `null`. */
  value?: string | null;
  /** Base id used to link parts. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the open value changes. */
  onValueChange?: (value: string | null) => void;
}
