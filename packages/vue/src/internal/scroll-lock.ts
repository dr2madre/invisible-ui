/**
 * Lock scrolling of the document body (e.g. while a modal is open) and
 * compensate for the removed scrollbar width to avoid a layout shift. Returns a
 * cleanup that restores the previous styles.
 *
 * Ported verbatim from the React adapter: the native `<dialog>` gives us the
 * top layer and an inert background, and the page behind it still scrolls, so
 * the adapter stops it. Safe under SSR/tests: a no-op when `document` is
 * unavailable.
 *
 * Locks are counted, because more than one overlay can be open and they do not
 * close in the order they opened. The page is restored by the last one to let
 * go, to exactly what it looked like before the first one took hold.
 */
/** How many overlays are holding the page still right now. */
let holders = 0;
/** What the page looked like before the first of them took hold. */
let before: { overflow: string; paddingRight: string } | null = null;

export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  const { body } = document;
  if (holders === 0) {
    before = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + scrollbarWidth}px`;
    }
  }
  holders += 1;

  let released = false;
  return () => {
    // A cleanup called twice must not let go of someone else's lock.
    if (released) return;
    released = true;
    holders -= 1;
    if (holders > 0 || !before) return;
    body.style.overflow = before.overflow;
    body.style.paddingRight = before.paddingRight;
    before = null;
  };
}
