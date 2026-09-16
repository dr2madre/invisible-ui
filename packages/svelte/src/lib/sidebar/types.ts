import type { ComponentType } from "svelte";

/** One destination in the sidebar. */
export interface SidebarItem {
  value: string;
  label: string;
  /** Renders the item as a link. Without it the item reports `onSelect`. */
  href?: string;
  /** Optional leading icon component (rendered as `<svelte:component>`). */
  icon?: ComponentType;
}

/** A labelled group of destinations. */
export interface SidebarSection {
  /** Optional section heading. */
  label?: string;
  items: SidebarItem[];
  /**
   * Turns the heading into a disclosure. Needs a `label`: without one there is
   * nothing to press. Plain sections stay exactly as they were.
   */
  collapsible?: boolean;
  /** Identifies the section in `openGroups`. Falls back to the label. */
  id?: string;
  /** Open on first render. A section holding the current item opens anyway. */
  defaultOpen?: boolean;
}
