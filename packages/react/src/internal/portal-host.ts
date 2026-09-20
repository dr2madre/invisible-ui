import { useEffect, useState, type RefObject } from "react";

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
    setHost(anchor.current?.closest("dialog") ?? document.body);
  }, [anchor]);
  return host;
}
