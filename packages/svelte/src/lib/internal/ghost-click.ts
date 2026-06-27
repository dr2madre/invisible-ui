/**
 * Swallow the duplicate "ghost" click that some touch browsers (notably iOS
 * Safari) synthesize shortly after a real tap. Without this, a trigger that
 * *toggles* open/closed on click opens on the real click and then immediately
 * closes again on the ghost click — the "opens for a fraction, then closes"
 * bug seen on dropdowns/menus on iOS.
 *
 * The listener is attached in the capture phase so a duplicate is stopped
 * before the element's own (bubble-phase) click handler runs. A real user
 * cannot deliberately open-then-close the same trigger within `windowMs`, so
 * legitimate toggling is unaffected; only the synthesized duplicate is dropped.
 *
 * Returns a cleanup that removes the listener.
 */
export function ignoreGhostClicks(node: HTMLElement, windowMs = 350): () => void {
  let last = -Infinity;
  const onClick = (event: Event) => {
    // `timeStamp` is monotonic per document, so no clock import is needed.
    if (event.timeStamp - last < windowMs) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }
    last = event.timeStamp;
  };
  node.addEventListener("click", onClick, true);
  return () => node.removeEventListener("click", onClick, true);
}
