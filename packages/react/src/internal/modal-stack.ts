/**
 * The focus return that lets modal dialogs stack (ADR 0016), shared with the
 * custom elements adapter's `internal/modal-stack.ts`.
 *
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
