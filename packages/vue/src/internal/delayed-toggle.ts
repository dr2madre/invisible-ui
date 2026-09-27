import { onScopeDispose } from "vue";

export interface DelayedToggle {
  /** Open after `delay` ms (default the open delay); cancels a pending close. */
  show: (delay?: number) => void;
  /** Close after `delay` ms (default the close delay); cancels a pending open. */
  hide: (delay?: number) => void;
  /** Cancel pending timers, keeping the current state. */
  hold: () => void;
}

/**
 * Open and close on a delay, the hover timing Tooltip and the hover preview
 * share. The delays are read when each call starts, so they follow the
 * options. Pending timers are dropped with the owning scope.
 */
export function useDelayedToggle(
  setOpen: (open: boolean) => void,
  openDelay: () => number,
  closeDelay: () => number,
): DelayedToggle {
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const hold = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  };
  // A pending hover must not open something after the component is gone.
  onScopeDispose(hold);
  const show = (delay = openDelay()) => {
    hold();
    if (delay <= 0) return setOpen(true);
    showTimer = setTimeout(() => setOpen(true), delay);
  };
  const hide = (delay = closeDelay()) => {
    hold();
    if (delay <= 0) return setOpen(false);
    hideTimer = setTimeout(() => setOpen(false), delay);
  };
  return { show, hide, hold };
}
