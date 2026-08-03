import {
  computed,
  defineComponent,
  h,
  onUnmounted,
  watch,
  type Component,
  type PropType,
} from "vue";
import { InlineNotification } from "../inline-notification/InlineNotification";
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
  /** Auto-dismiss delay in ms — opt-in. `0` (default) keeps it until closed. */
  duration?: number;
  closable?: boolean;
  role?: "status" | "alert";
  actions?: NotificationAction[];
  /**
   * High-contrast inverse surface for maximum visibility. Recommended for
   * transient info outcomes that auto-dismiss (saved, offline, downtime…).
   */
  inverted?: boolean;
  /** Snackbar layout: one compact row (icon + title + inline action), no description. */
  snack?: boolean;
  /** Rich body: a Vue component rendered instead of `text` (ignored in snack). */
  component?: Component;
  /** Props for `component`. */
  componentProps?: Record<string, unknown>;
  /** Shape of the FeedbackIcon box — `"rounded"` (default) or a full `"round"` circle. */
  iconShape?: "rounded" | "round";
  /** FeedbackIcon box override (see InlineNotification): force `"tint"`/`"solid"` on a tinted surface. */
  iconBox?: "tint" | "transparent" | "solid";
  /** Called when the notification closes, with the reason (timeout / user / action). */
  onClose?: (reason: NotificationDismissReason) => void;
  /**
   * Hold the auto-dismiss countdown (the region sets this while the whole stack
   * is hovered or focused, so a burst of toasts pauses together — not just the
   * one under the pointer).
   */
  paused?: boolean;
}

/**
 * Notification — a floating message (toast / snack), meant to be stacked
 * inside a `NotificationRegion`. It reuses the InlineNotification for its
 * anatomy and accessibility (it *is* the live region — there is no extra
 * wrapper), and adds timing:
 *
 * - **Persistent by default** (`duration = 0`): the user reads and closes it
 *   at their own pace. Auto-dismiss is opt-in (`duration` in ms) and should
 *   be reserved for information the user does not need to act on or read
 *   carefully.
 * - When a `duration` is set, the countdown pauses while the stack is
 *   hovered or focused (so action buttons can be used), per WCAG 2.2.1
 *   Timing — the region drives this through the `paused` prop. The timer
 *   restarts if `duration` changes (e.g. a promise notification swapping
 *   loading → success).
 * - Closable by default; supports action buttons that dismiss on click.
 *
 * Enter/leave motion, elevation and placement are handled by
 * `NotificationRegion`.
 */
export const Notification = defineComponent({
  name: "Notification",
  props: {
    status: { type: String as PropType<NotificationStatus>, default: "info" },
    title: { type: String, default: undefined },
    text: { type: String, default: undefined },
    duration: { type: Number, default: 0 },
    closable: { type: Boolean, default: true },
    role: { type: String as PropType<"status" | "alert">, default: "status" },
    actions: { type: Array as PropType<NotificationAction[]>, default: undefined },
    inverted: { type: Boolean, default: false },
    snack: { type: Boolean, default: false },
    component: { type: Object as PropType<Component>, default: undefined },
    componentProps: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
    iconShape: { type: String as PropType<"rounded" | "round">, default: "rounded" },
    iconBox: { type: String as PropType<"tint" | "transparent" | "solid">, default: undefined },
    onClose: {
      type: Function as PropType<(reason: NotificationDismissReason) => void>,
      default: undefined,
    },
    paused: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let remaining = props.duration;
    let startedAt = 0;

    const clearTimer = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
    };

    const start = () => {
      if (props.duration <= 0 || remaining <= 0 || timer !== undefined) return;
      startedAt = Date.now();
      timer = setTimeout(() => props.onClose?.("timeout"), remaining);
    };

    const pause = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      remaining -= Date.now() - startedAt;
    };

    // Region-driven pause: hold while `paused`, resume when released. The
    // immediate run also starts the countdown on mount.
    watch(
      () => props.paused,
      (paused) => {
        if (paused) pause();
        else start();
      },
      { immediate: true },
    );

    // (Re)initialise the countdown whenever the duration changes.
    watch(
      () => props.duration,
      (duration) => {
        clearTimer();
        remaining = duration;
        if (!props.paused) start();
      },
    );

    onUnmounted(clearTimer);

    // Action clicks run the handler, then dismiss unless told to stay open.
    const alertActions = computed(() =>
      props.actions?.map((action) => ({
        label: action.label,
        // Ghost by default, like the inline banner: the action must not
        // outweigh the message (override per action when one must stand out).
        variant: action.variant ?? ("ghost" as const),
        onClick: () => {
          action.onClick?.();
          if (!action.keepOpen) props.onClose?.("action");
        },
      })),
    );

    // No wrapper: the InlineNotification is the live region.
    return () =>
      h(
        InlineNotification,
        {
          status: props.status,
          title: props.title ?? "",
          description: props.text ?? "",
          role: props.role,
          closable: props.closable,
          inverted: props.inverted,
          snack: props.snack,
          component: props.component,
          componentProps: props.componentProps,
          iconShape: props.iconShape,
          iconBox: props.iconBox,
          actions: alertActions.value,
          onClose: () => props.onClose?.("user"),
        },
        slots.icon ? { icon: slots.icon } : undefined,
      );
  },
});
