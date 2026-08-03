/**
 * Swallow the duplicate "ghost" click that some touch browsers (notably iOS
 * Safari) synthesize shortly after a real tap. Without this, a trigger that
 * *toggles* open/closed on click opens on the real tap and then immediately
 * closes again on the ghost click, the "opens for a fraction, then closes"
 * bug seen on dropdowns and menus on iOS.
 *
 * Ghost clicks exist only after touch input, so the guard arms itself only
 * when the preceding `pointerdown` reports `pointerType: "touch"`: the click
 * that follows the tap passes and starts the window, and any further click
 * inside the window (the synthesized duplicate arrives with no fresh press)
 * is dropped. Mouse and keyboard activations always pass, however quick.
 *
 * The listener is attached in the capture phase so a duplicate is stopped
 * before the element's own (bubble-phase) click handler runs. Returns a
 * cleanup that removes the listeners.
 */
export function ignoreGhostClicks(node: HTMLElement, windowMs = 350): () => void {
  let lastTouchClick = -Infinity;
  let pointerType = "";

  const onPointerdown = (event: PointerEvent) => {
    pointerType = event.pointerType;
  };

  const onClick = (event: MouseEvent) => {
    // `timeStamp` is monotonic per document, so no clock import is needed.
    if (event.timeStamp - lastTouchClick < windowMs) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }
    if (pointerType === "touch") lastTouchClick = event.timeStamp;
    pointerType = "";
  };

  node.addEventListener("pointerdown", onPointerdown, true);
  node.addEventListener("click", onClick, true);
  return () => {
    node.removeEventListener("pointerdown", onPointerdown, true);
    node.removeEventListener("click", onClick, true);
  };
}
