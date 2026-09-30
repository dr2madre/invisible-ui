/** How long a "Copied" confirmation stays up, in ms. */
export const COPIED_DURATION = 2000;

/**
 * The confirmation shown next to a control that copied something (ADR 0016):
 * `copy(text)` writes to the clipboard and, when that worked, sets `copied`
 * for `COPIED_DURATION` ms. The control renders the confirmation and its
 * announcement from `copied`, and calls `reset()` when it goes away.
 *
 * The clipboard can be missing or refuse (an insecure context, a denied
 * permission): nothing was copied, so `copied` stays off and nothing is
 * announced.
 */
export class CopyFeedback {
  copied = $state(false);
  #timer: ReturnType<typeof setTimeout> | undefined;

  /** Copy `text`; resolves `true` when the clipboard took it. */
  async copy(text: string): Promise<boolean> {
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (!clipboard?.writeText) return false;
    try {
      await clipboard.writeText(text);
    } catch {
      return false;
    }
    this.copied = true;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.copied = false;
    }, COPIED_DURATION);
    return true;
  }

  /** Drop the confirmation, when the control goes away. */
  reset(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this.copied = false;
  }
}
