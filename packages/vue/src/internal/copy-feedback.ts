import { onScopeDispose, shallowReadonly, shallowRef, type ShallowRef } from "vue";

/** How long a "Copied" confirmation stays up, in ms. */
export const COPIED_DURATION = 2000;

export interface CopyFeedback {
  /** Whether the confirmation is showing. */
  copied: Readonly<ShallowRef<boolean>>;
  /** Copy `text`; resolves `true` when the clipboard took it. */
  copy: (text: string) => Promise<boolean>;
}

/**
 * The confirmation shown next to a control that copied something (ADR 0016):
 * `copy(text)` writes to the clipboard and, when that worked, sets `copied`
 * for `COPIED_DURATION` ms. The control renders the confirmation and its
 * announcement from `copied`.
 *
 * The clipboard can be missing or refuse (an insecure context, a denied
 * permission): nothing was copied, so `copied` stays off and nothing is
 * announced.
 */
export function useCopyFeedback(): CopyFeedback {
  const copied = shallowRef(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const copy = async (text: string): Promise<boolean> => {
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (!clipboard?.writeText) return false;
    try {
      await clipboard.writeText(text);
    } catch {
      return false;
    }
    copied.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      copied.value = false;
    }, COPIED_DURATION);
    return true;
  };

  onScopeDispose(() => clearTimeout(timer));

  return { copied: shallowReadonly(copied), copy };
}
