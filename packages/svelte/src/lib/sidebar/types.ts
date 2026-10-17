import type { navigationBar } from "@invisible-ui/core";
import type { Component, ComponentType } from "svelte";

/**
 * One destination in the sidebar: the Navigation Bar's destination with an
 * optional icon, so the same list serves both. `href` renders a link; without
 * it the item reports `onSelect`. A `badge` adds its text to the name and is
 * announced when it appears or changes; `unavailable` keeps the item visible
 * and focusable with its reason, and activation does nothing.
 */
export interface SidebarItem extends navigationBar.NavigationTarget {
  /**
   * Optional leading icon component, rendered without props. The
   * rail is only offered when every destination has one: an icon is the whole
   * of what a destination shows once the labels are out of sight. A runes
   * component and a legacy class component both work.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the props are the component's own
  icon?: Component<any> | ComponentType;
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
