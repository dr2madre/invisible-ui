/**
 * Lock scrolling of the document body (e.g. while a modal is open) and
 * compensate for the removed scrollbar width to avoid a layout shift. Returns a
 * cleanup that restores the previous styles.
 *
 * The shared scroll-lock primitive for modal overlays (Dialog, Alert Dialog,
 * Sheet, Drawer). Safe under SSR/tests: a no-op when `document` is unavailable.
 */
export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  const { body } = document;
  const previousOverflow = body.style.overflow;
  const previousPaddingRight = body.style.paddingRight;

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${current + scrollbarWidth}px`;
  }

  return () => {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
  };
}
