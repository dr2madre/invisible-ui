/**
 * The modal dialogs open in a document, so other components can wait for them
 * to close (ADR 0016), and the focus return that lets modals stack. Shared
 * with the custom elements adapter's `internal/modal-stack.ts`.
 *
 * The dialogs of this package register their panel while it is shown. A modal
 * opened any other way is found through `:modal`. The registry covers
 * environments where `:modal` never matches, such as a test DOM.
 */
const shown = new Set<HTMLDialogElement>();

/** Record a panel shown with `showModal()`; returns the release. */
export function trackModal(panel: HTMLDialogElement): () => void {
  shown.add(panel);
  return () => {
    shown.delete(panel);
  };
}

/** Whether any modal dialog is open in the document. */
export function hasOpenModal(doc: Document = document): boolean {
  for (const panel of shown) {
    if (panel.open && panel.isConnected && panel.ownerDocument === doc) return true;
  }
  for (const dialog of doc.querySelectorAll("dialog[open]")) {
    try {
      if (dialog.matches(":modal")) return true;
    } catch {
      // A browser without `:modal` relies on the registry alone.
    }
  }
  return false;
}

/**
 * Call `callback` after any dialog in the document opens or closes.
 * `showModal()` and `close()` both change the `open` attribute; a dialog
 * removed while open changes the tree. Returns the unsubscribe.
 */
export function onModalChange(doc: Document, callback: () => void): () => void {
  if (typeof MutationObserver === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ["open"],
    childList: true,
    subtree: true,
  });
  return () => observer.disconnect();
}

/**
 * Give focus back after a modal closes: to the element that had it when the
 * modal opened, so a dialog opened from inside another returns focus there,
 * else to `fallback` (usually the trigger). A candidate that cannot take
 * focus, because it is gone or hidden, passes to the next.
 */
export function returnFocus(previous: HTMLElement | null, fallback: HTMLElement | null): void {
  const doc = (previous ?? fallback)?.ownerDocument;
  for (const candidate of [previous, fallback]) {
    if (!candidate?.isConnected || candidate === doc?.body) continue;
    candidate.focus();
    if (doc?.activeElement === candidate) return;
  }
}
