import { navigationBar } from "@invisible-ui/core";
import { useEffect, useRef, useState, type RefObject } from "react";
import { hasOpenModal, onModalChange } from "./modal-stack";

type Translate = NonNullable<navigationBar.TextOptions["translate"]>;

/**
 * The polite live region of a navigation, Navigation Bar or Sidebar: a badge
 * that appears or changes is announced once, never on mount, and while a
 * modal dialog outside the navigation is open the latest one per destination
 * waits for it to close (ADR 0016). Returns what the region says and the ref
 * for the region itself.
 */
export function useBadgeAnnouncements(
  targets: readonly navigationBar.NavigationTarget[],
  translate: Translate,
): [navigationBar.BadgeAnnouncement[], RefObject<HTMLDivElement | null>] {
  const [announcer] = useState(navigationBar.createBadgeAnnouncer);
  const [spoken, setSpoken] = useState<navigationBar.BadgeAnnouncement[]>([]);
  const live = useRef<HTMLDivElement>(null);

  // The first run records the badges on screen; later ones announce changes.
  useEffect(() => {
    const node = live.current;
    const said = announcer.update(targets, () => !!node && hasOpenModal(node.ownerDocument, node), {
      translate,
    });
    if (said.length > 0) setSpoken(said);
  }, [announcer, targets, translate]);

  useEffect(() => {
    const node = live.current;
    if (!node) return;
    return onModalChange(node.ownerDocument, () => {
      const said = announcer.release(hasOpenModal(node.ownerDocument, node));
      if (said.length > 0) setSpoken(said);
    });
  }, [announcer]);

  return [spoken, live];
}
