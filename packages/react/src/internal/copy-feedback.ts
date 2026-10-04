import { useCallback, useEffect, useRef, useState } from "react";

/** How long a "Copied" confirmation stays up, in ms. */
const COPIED_DURATION = 2000;

/**
 * The confirmation shown next to a control that copied something (ADR 0016),
 * the React counterpart of the custom elements adapter's `CopyFeedback`:
 * `copy(text)` writes to the clipboard and, when that worked, turns `copied`
 * on for `COPIED_DURATION` ms. The control renders the confirmation and its
 * announcement from `copied`.
 *
 * The clipboard can be missing or refuse (an insecure context, a denied
 * permission): nothing was copied, so `copied` stays off and nothing is
 * announced.
 */
export function useCopyFeedback(): {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
} {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // A copy can resolve after the control is gone: it then starts no timer.
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      timer.current = undefined;
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (!clipboard?.writeText) return false;
    try {
      await clipboard.writeText(text);
    } catch {
      return false;
    }
    if (!mounted.current) return true;
    clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      setCopied(false);
    }, COPIED_DURATION);
    return true;
  }, []);

  return { copied, copy };
}
