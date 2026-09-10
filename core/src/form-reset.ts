/**
 * Tell a control that the form it belongs to was reset, so it can put its own
 * state back to the current default without notifying anyone. See ADR 0012:
 * a reset is not a user change, so no change callback fires.
 *
 * The listener sits on the document, and the owner is resolved when the event
 * arrives, not when the control mounts: a control moved into another form, or
 * pointed at one with the `form` attribute, follows its real owner.
 *
 * The restore runs one task later, and only if nothing cancelled the event.
 * The reset event arrives before the browser restores anything and before
 * cancellation is settled, and a microtask is not late enough on a real
 * reset-button press: a task is the first safe moment to read
 * `defaultPrevented` and to follow the native restore.
 */

/** An element that can name its form owner. */
type Associated = Element & { form: HTMLFormElement | null };

/**
 * Call `restore` after `anchor()`'s form is reset and the browser has run the
 * native restore. Returns the teardown. `anchor` is read again at event time,
 * so a control that was in no form when it mounted, or has since moved to
 * another, follows whatever owner it has then; resolving `null` means it is
 * in no form right now, and nothing happens.
 */
export function onFormReset(
  doc: Document,
  anchor: () => Associated | null,
  restore: () => void,
): () => void {
  const pending = new Set<ReturnType<typeof setTimeout>>();

  const onReset = (event: Event) => {
    const owner = anchor()?.form ?? null;
    if (!owner || event.target !== owner) return;
    // Each reset is answered on its own: one cancelled event must not call
    // off a restore an earlier, uncancelled one is still owed. Restoring is
    // idempotent, so answering twice costs nothing.
    const timer = setTimeout(() => {
      pending.delete(timer);
      if (!event.defaultPrevented) restore();
    }, 0);
    pending.add(timer);
  };

  doc.addEventListener("reset", onReset);
  return () => {
    for (const timer of pending) clearTimeout(timer);
    pending.clear();
    doc.removeEventListener("reset", onReset);
  };
}
