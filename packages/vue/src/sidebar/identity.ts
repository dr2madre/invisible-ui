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
 * production the fallback is deterministic and never shared: a section with no
 * id answers to its position, and a name already taken is answered to by the
 * first section that claimed it, the later ones getting a numbered spelling of
 * it. Plain sections claim their names too, because the list is keyed by them.
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
    // A plain section is never named in `openGroups`, but it is still one of
    // the list's keys, so its name has to be its own too.
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
      return { section, id: claim(declared) };
    }
    return { section, id: claim(declared) };
  });
}

/** Whether the rail can be offered: every destination must show something. */
export function canRail(sections: SidebarSection[]): boolean {
  return sections.every((section) => section.items.every((item) => item.icon));
}
