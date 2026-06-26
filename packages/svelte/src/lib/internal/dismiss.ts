/**
 * Call `onDismiss` on a pointerdown outside every element in `inside`
 * (null entries are ignored, so refs that aren't mounted yet are fine).
 * Listens in the capture phase. Returns a cleanup that removes the listener.
 *
 * The shared "dismissable layer" primitive for overlays (Popover, Dropdown
 * Menu, Tooltip, …) so outside-press handling lives in one place.
 */
export function onOutsidePointerDown(
  inside: Array<HTMLElement | null | undefined>,
  onDismiss: (event: PointerEvent) => void,
): () => void {
  const handler = (event: Event) => {
    const target = event.target as Node;
    if (inside.some((el) => el?.contains(target))) return;
    onDismiss(event as PointerEvent);
  };
  document.addEventListener("pointerdown", handler, true);
  return () => document.removeEventListener("pointerdown", handler, true);
}
