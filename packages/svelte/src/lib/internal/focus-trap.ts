/** Selector for elements that can receive keyboard focus. */
export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The focusable descendants of `container`, in DOM order. */
export function focusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/**
 * Trap Tab focus within `container`: Tab past the last focusable wraps to the
 * first, Shift+Tab before the first wraps to the last, and focus leaking outside
 * the container is pulled back in. Returns a cleanup that removes the listener.
 *
 * The shared focus-trap primitive for modal overlays (Dialog, Alert Dialog,
 * Sheet, Drawer) so the trapping logic lives in one place.
 */
export function trapFocus(container: HTMLElement): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const items = focusable(container);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      // Nothing focusable inside — keep focus on the container itself.
      event.preventDefault();
      container.focus();
      return;
    }
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !container.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKeyDown);
  return () => container.removeEventListener("keydown", onKeyDown);
}
