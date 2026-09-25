/**
 * Swallow the duplicate "ghost" click that some touch browsers (notably iOS
 * Safari) synthesize shortly after a real tap. A trigger that toggles on click
 * would otherwise open on the tap and close again on the duplicate.
 *
 * The guard arms only after a `pointerdown` with `pointerType: "touch"`, so
 * mouse and keyboard activations always pass, however quick. It listens in the
 * capture phase to stop the duplicate before the element's own click handler.
 * Returns a cleanup that removes the listeners.
 */
export function ignoreGhostClicks(node: HTMLElement, windowMs = 350): () => void {
  let lastTouchClick = -Infinity;
  let pointerType = "";

  const onPointerdown = (event: PointerEvent) => {
    pointerType = event.pointerType;
  };

  const onClick = (event: MouseEvent) => {
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
