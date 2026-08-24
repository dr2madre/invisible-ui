/**
 * Lock scrolling of the document body (e.g. while a modal is open) and
 * compensate for the removed scrollbar width to avoid a layout shift. Returns a
 * cleanup that restores the previous styles. Calling it twice is harmless.
 *
 * The shared scroll-lock primitive for modal overlays (Dialog, Alert Dialog,
 * Sheet, Drawer). Safe under SSR/tests: a no-op when `document` is unavailable.
 *
 * Locks are counted, because more than one overlay can be open and they do not
 * close in the order they opened: the page is restored by the last one to let
 * go, to exactly what it looked like before the first one took hold. The count
 * lives on the body rather than in this module, so overlays from two adapters,
 * or from two copies of one package, still count together.
 */
/** How many overlays are holding the page still, and what it looked like. */
const COUNT = "dsScrollLocks";
const PREVIOUS = "dsScrollLockPrevious";

export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  const { body } = document;
  const holders = Number(body.dataset[COUNT] ?? "0");
  if (holders === 0) {
    body.dataset[PREVIOUS] = JSON.stringify([body.style.overflow, body.style.paddingRight]);
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + scrollbarWidth}px`;
    }
  }
  body.dataset[COUNT] = String(holders + 1);

  let released = false;
  return () => {
    // A cleanup called twice must not let go of someone else's lock.
    if (released) return;
    released = true;
    const left = Number(body.dataset[COUNT] ?? "1") - 1;
    if (left > 0) {
      body.dataset[COUNT] = String(left);
      return;
    }
    const [overflow, paddingRight] = JSON.parse(body.dataset[PREVIOUS] ?? '["",""]') as [
      string,
      string,
    ];
    body.style.overflow = overflow;
    body.style.paddingRight = paddingRight;
    delete body.dataset[COUNT];
    delete body.dataset[PREVIOUS];
  };
}
