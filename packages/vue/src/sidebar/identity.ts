import { fail } from "../internal/dev";
import type { SidebarSection } from "./types";

export interface ResolvedSection {
  section: SidebarSection;
  /** The name this section answers to in `openGroups`. */
  id: string;
}

/**
 * The name each section answers to in `openGroups`, resolved once per render.
 *
 * A collapsible section must carry an `id`, and no two may carry the same one:
 * sharing a name means sharing an open state, so two sections would open
 * together. Both are consumer mistakes, so both throw in development. In
 * production the fallback is deterministic rather than shared: a section with
 * no id answers to its position, and a repeated id keeps the first section and
 * gives the later ones their position instead.
 */
export function resolveSections(sections: SidebarSection[]): ResolvedSection[] {
  const taken = new Set<string>();
  return sections.map((section, index) => ({ section, id: resolveId(section, index, taken) }));
}

function resolveId(section: SidebarSection, index: number, taken: Set<string>): string {
  if (!section.collapsible) return section.id ?? String(index);

  const declared = section.id;
  if (!declared) {
    fail(
      `a collapsible sidebar section needs an id ("${section.label}" has none): ` +
        "it is the name the section answers to in openGroups",
    );
    const positional = String(index);
    taken.add(positional);
    return positional;
  }
  if (taken.has(declared)) {
    fail(
      `two collapsible sidebar sections share the id "${declared}": ` +
        "sharing a name means sharing an open state",
    );
    const positional = `${declared}#${index}`;
    taken.add(positional);
    return positional;
  }
  taken.add(declared);
  return declared;
}

/** Whether the rail can be offered: every destination must show something. */
export function canRail(sections: SidebarSection[]): boolean {
  return sections.every((section) => section.items.every((item) => item.icon));
}
