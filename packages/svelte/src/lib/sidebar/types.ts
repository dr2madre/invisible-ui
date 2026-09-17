import type { ComponentType } from "svelte";

/** One destination in the sidebar. */
export interface SidebarItem {
  value: string;
  label: string;
  /** Renders the item as a link. Without it the item reports `onSelect`. */
  href?: string;
  /**
   * Optional leading icon component (rendered as `<svelte:component>`). The
   * rail is only offered when every destination has one: an icon is the whole
   * of what a destination shows once the labels are out of sight.
   */
  icon?: ComponentType;
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
