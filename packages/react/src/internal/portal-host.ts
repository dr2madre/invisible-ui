import { useEffect, useState, type RefObject } from "react";

/**
 * Where an overlay belonging to `anchor` must be portalled.
 *
 * A modal dialog paints in the browser's top layer, above everything in the
 * body, and makes the rest of the page inert. An overlay that belongs to a
 * control inside the dialog has to stay in that same layer, or it shows
 * through but cannot be clicked. The Svelte and Vue adapters resolve the same
 * way (`internal/portal.ts`).
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
