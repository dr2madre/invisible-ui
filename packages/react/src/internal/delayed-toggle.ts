import { useEffect, useMemo, useRef } from "react";
import { useIsomorphicLayoutEffect } from "./layout-effect";

export interface DelayedToggle {
  /** Open after `delay` ms (default the open delay); cancels a pending close. */
  show: (delay?: number) => void;
  /** Close after `delay` ms (default the close delay); cancels a pending open. */
  hide: (delay?: number) => void;
  /** Cancel the pending open or close, keeping the current state. */
  hold: () => void;
}

/**
 * Open and close on a delay: the hover timing Tooltip, the hover preview and
 * Navigation Menu share, the counterpart of `useDelayedToggle` in the Vue
 * adapter. The returned functions are stable; the setter and the delays are
 * read when each call starts. A pending timer dies with the component.
 */
export function useDelayedToggle(
  setOpen: (open: boolean) => void,
  openDelay: number,
  closeDelay: number,
): DelayedToggle {
  const latest = useRef({ setOpen, openDelay, closeDelay });
  useIsomorphicLayoutEffect(() => {
    latest.current = { setOpen, openDelay, closeDelay };
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return useMemo(() => {
    const hold = () => clearTimeout(timer.current);
    const run = (open: boolean, delay: number) => {
      hold();
      if (delay <= 0) latest.current.setOpen(open);
      else timer.current = setTimeout(() => latest.current.setOpen(open), delay);
    };
    return {
      show: (delay = latest.current.openDelay) => run(true, delay),
      hide: (delay = latest.current.closeDelay) => run(false, delay),
      hold,
    };
  }, []);
}
