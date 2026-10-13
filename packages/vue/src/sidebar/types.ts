import type { navigationBar } from "@design-system/core";
import type { Component } from "vue";

/**
 * One destination in the sidebar: the Navigation Bar's destination with an
 * optional icon, so the same list serves both. `href` renders a link; without
 * it the item reports `onSelect`. A `badge` adds its text to the name and is
 * announced when it appears or changes; `unavailable` keeps the item visible
 * and focusable with its reason, and activation does nothing.
 */
export interface SidebarItem extends navigationBar.NavigationTarget {
  /**
   * Optional leading icon (any Vue component). Wrap it in `markRaw()` so Vue
   * keeps it out of the reactive proxy it builds for the `sections` prop. The
   * rail is only offered when every destination has one: an icon is the whole
   * of what a destination shows once the labels are out of sight.
   */
  icon?: Component;
}

/** A group of destinations under an optional heading. */
export interface SidebarPlainSection {
  /** Optional section heading. */
  label?: string;
  items: SidebarItem[];
  collapsible?: false;
  /** Unused here; a plain section is never named in `openGroups`. */
  id?: string;
}

/**
 * A group whose heading is a disclosure. The `id` is required because it is
 * the name the section answers to in `openGroups`: two sections may share a
 * label, and a label is not an identity.
 */
export interface SidebarCollapsibleSection {
  label: string;
  items: SidebarItem[];
  collapsible: true;
  id: string;
  /** Open on first render. A section holding the current item opens anyway. */
  defaultOpen?: boolean;
}

export type SidebarSection = SidebarPlainSection | SidebarCollapsibleSection;
