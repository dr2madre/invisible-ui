import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { InlineNotification } from "../inline-notification/InlineNotification";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import type {
  NotificationAction,
  NotificationDismissReason,
  NotificationStatus,
} from "./create-notifier";

export interface NotificationProps {
  /** Feedback status: `info` | `success` | `warning` | `danger` | `neutral`. */
  status?: NotificationStatus;
  title?: string;
  text?: string;
  /** Auto-dismiss delay in ms, opt-in. `0` (default) keeps it until closed. */
  duration?: number;
  closable?: boolean;
  role?: "status" | "alert";
  actions?: NotificationAction[];
  /** A high-contrast surface, for short outcomes that auto-dismiss. */
  inverted?: boolean;
  /** Snackbar layout: one compact row (icon, title, inline action), no body text. */
  snack?: boolean;
  /** Rich body: a component rendered in place of `text` (ignored in `snack`). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the props are the component's own
  component?: ComponentType<any>;
  /** Props for `component`. */
  componentProps?: Record<string, unknown>;
  /** Shape of the icon box: `"rounded"` (default) or a full `"round"` circle. */
  iconShape?: "rounded" | "round";
  /** Icon box override (see `InlineNotification`). */
  iconBox?: "tint" | "transparent" | "solid";
  /** Called when the notification closes, with the reason (timeout, user or action). */
  onClose?: (reason: NotificationDismissReason) => void;
  /**
   * Hold the auto-dismiss countdown. The region sets it while the stack is
   * hovered or focused, so a burst of notifications pauses together.
   */
  paused?: boolean;
  /** A custom glyph for the icon. */
  icon?: ReactNode;
}

/**
 * Notification: a floating message, stacked inside a `NotificationRegion`.
 * It is an `InlineNotification`, the live region itself with no wrapper, plus
 * timing:
 *
 * - Persistent by default (`duration = 0`): the user reads and closes it at
 *   their own pace. Auto-dismiss is opt-in, for information the user does not
 *   need to act on or read carefully.
 * - With a `duration`, the countdown holds while `paused` (the region pauses
 *   the stack while it is hovered or focused, WCAG 2.2.1). A new `duration`
 *   starts the countdown again, as when a promise notification turns from
 *   loading into success.
 * - Closable by default; an action button dismisses it after it runs.
 *
 * Motion, elevation and placement belong to `NotificationRegion`.
 */
export function Notification({
  status = "info",
  title,
  text,
  duration = 0,
  closable = true,
  role = "status",
  actions,
  inverted = false,
  snack = false,
  component,
  componentProps,
  iconShape = "rounded",
  iconBox,
  onClose,
  paused = false,
  icon,
}: NotificationProps) {
  const latestOnClose = useRef(onClose);
  useIsomorphicLayoutEffect(() => {
    latestOnClose.current = onClose;
  });

  // The time left, kept across pauses. A new duration starts it over; the
  // countdown effect below takes the time it ran off when it stops.
  const clock = useRef({ remaining: duration });
  useEffect(() => {
    clock.current.remaining = duration;
  }, [duration]);
  useEffect(() => {
    const state = clock.current;
    if (paused || duration <= 0 || state.remaining <= 0) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => latestOnClose.current?.("timeout"), state.remaining);
    return () => {
      clearTimeout(timer);
      state.remaining -= Date.now() - startedAt;
    };
  }, [paused, duration]);

  // An action runs its handler, then dismisses unless it keeps the notification open.
  const alertActions = actions?.map((action) => ({
    label: action.label,
    // Ghost by default, like the inline banner: the action must not outweigh
    // the message.
    variant: action.variant ?? ("ghost" as const),
    onClick: () => {
      action.onClick?.();
      if (!action.keepOpen) onClose?.("action");
    },
  }));

  return (
    <InlineNotification
      status={status}
      title={title ?? ""}
      description={text ?? ""}
      role={role}
      closable={closable}
      inverted={inverted}
      snack={snack}
      component={component}
      componentProps={componentProps}
      iconShape={iconShape}
      iconBox={iconBox}
      actions={alertActions}
      onClose={() => onClose?.("user")}
      icon={icon}
    />
  );
}
