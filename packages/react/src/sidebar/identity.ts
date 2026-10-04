import type { ReactNode } from "react";
import { fail } from "../internal/dev";

/** One destination in the sidebar. */
export interface SidebarItem {
  value: string;
  label: string;
  /** Renders the item as a link. Without it the item reports `onSelect`. */
  href?: string;
  /**
   * Optional leading icon, decorative. The rail is only offered when every
   * destination has one: an icon is the whole of what a destination shows
   * once the labels are out of sight.
   */
  icon?: ReactNode;
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

/** A section with the name it answers to in `openGroups`. */
export interface ResolvedSection {
  section: SidebarSection;
  id: string;
}

/**
 * The name each section answers to in `openGroups` (ADR 0013).
 *
 * A collapsible section must carry an `id`, and no two may carry the same one:
 * sharing a name means sharing an open state. Both are consumer mistakes, so
 * both throw in development. In production the fallback is deterministic and
 * never shared: a section with no id answers to its position, and a name
 * already taken stays with the section that claimed it first, the later ones
 * getting a numbered spelling of it. Plain sections claim their names too,
 * because the list is keyed by them.
 */
export function resolveSections(sections: SidebarSection[]): ResolvedSection[] {
  const taken = new Set<string>();

  /** The candidate, or the first spelling of it nothing else answers to. */
  const claim = (candidate: string) => {
    let id = candidate;
    for (let n = 2; taken.has(id); n += 1) id = `${candidate}#${n}`;
    taken.add(id);
    return id;
  };

  return sections.map((section, index) => {
    if (!section.collapsible) return { section, id: claim(section.id ?? String(index)) };

    const declared = section.id;
    if (!declared) {
      fail(
        `a collapsible sidebar section needs an id ("${section.label}" has none): ` +
          "it is the name the section answers to in openGroups",
      );
      return { section, id: claim(String(index)) };
    }
    if (taken.has(declared)) {
      fail(
        `two collapsible sidebar sections share the id "${declared}": ` +
          "sharing a name means sharing an open state",
      );
    }
    return { section, id: claim(declared) };
  });
}

/** Whether the rail can be offered: every destination must show something. */
export const canRail = (sections: SidebarSection[]): boolean =>
  sections.every((section) => section.items.every((item) => item.icon != null));

/** Whether the section holds the current destination. */
export const holdsCurrent = (section: SidebarSection, current: string | null): boolean =>
  current != null && section.items.some((item) => item.value === current);
