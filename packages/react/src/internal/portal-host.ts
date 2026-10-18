import { i18n } from "@invisible-ui/core";
import { useEffect, useState, type RefObject } from "react";
import { useIsomorphicLayoutEffect } from "./layout-effect";

/**
 * Where an overlay belonging to `anchor` must be portalled: the dialog the
 * control sits in, or the body. An overlay left in the body while a modal
 * dialog is open can be seen but not clicked. The dialog does not have to be
 * open yet. The other adapters answer the same question in
 * `packages/svelte/src/lib/internal/portal.ts` and
 * `packages/vue/src/internal/locale-teleport.ts`, which sends the overlay to
 * the dialog when there is one and to the body when there is not.
 *
 * Null until the effect has run, so nothing is portalled during the server
 * render or the first client render.
 */
export function usePortalHost(anchor: RefObject<HTMLElement | null>): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    // The host is read from the DOM, which exists only once the anchor has committed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(anchor.current?.closest("dialog") ?? document.body);
  }, [anchor]);
  return host;
}

/**
 * The direction an overlay portalled out of `anchor`'s tree takes: the
 * computed direction of `anchor`, read after each commit (an overlay opens
 * with a render), so a `dir` on a plain wrapper around the control counts as
 * it does for the control. `fallback`, the i18n context's direction, until it
 * can be read.
 */
export function useAnchorDirection(
  anchor: RefObject<HTMLElement | null>,
  fallback: i18n.Dir,
): i18n.Dir {
  const [read, setRead] = useState<i18n.Dir | null>(null);
  useIsomorphicLayoutEffect(() => {
    const next = i18n.elementDirection(anchor.current);
    // Set only on a change, so the render it causes reads the same and stops.
    if (next !== read) setRead(next);
  });
  return read ?? fallback;
}
