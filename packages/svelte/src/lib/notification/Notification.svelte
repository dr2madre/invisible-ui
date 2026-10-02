<script lang="ts">
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
   * - When a `duration` is set, the countdown pauses while the notification is
   *   hovered or focused (so action buttons can be used), per WCAG 2.2.1
   *   Timing. The pause listeners sit on the live region itself — the element
   *   the user interacts with — so no presentational wrapper is needed. The
   *   timer restarts if `duration` changes (e.g. a promise notification
   *   swapping loading → success).
   * - Closable by default; supports action buttons that dismiss on click.
   *
   * Enter/leave motion, elevation and placement are handled by
   * `NotificationRegion`.
   */
  import { onDestroy, untrack, type Snippet } from "svelte";
  import InlineNotification from "../inline-notification/InlineNotification.svelte";
  import type {
    NotificationAction,
    NotificationDismissReason,
    NotificationStatus,
  } from "./create-notifier";

  interface Props {
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
    /* eslint-disable @typescript-eslint/no-explicit-any -- the props are the component's own */
    /** Rich body: a Svelte component rendered instead of `text` (ignored in snack). */
    component?: import("svelte").Component<any> | import("svelte").ComponentType;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    /** Props for `component`. */
    componentProps?: Record<string, unknown>;
    /** Shape of the FeedbackIcon box — `"rounded"` (default) or a full `"round"` circle. */
    iconShape?: "rounded" | "round";
    /** FeedbackIcon box override (see InlineNotification): force `"tint"`/`"solid"` on a tinted surface. */
    iconBox?: "tint" | "transparent" | "solid";
    /** Called when the notification closes, with the reason (timeout / user / action). */
    onclose?: (reason: NotificationDismissReason) => void;
    /**
     * Hold the auto-dismiss countdown (the region sets this while the whole stack
     * is hovered or focused, so a burst of toasts pauses together — not just the
     * one under the pointer).
     */
    paused?: boolean;
    /** Custom glyph, forwarded to the InlineNotification's FeedbackIcon. */
    icon?: Snippet;
  }

  let {
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
    componentProps = {},
    iconShape = "rounded",
    iconBox,
    onclose,
    paused = false,
    icon,
  }: Props = $props();

  let timer: ReturnType<typeof setTimeout> | undefined;
  // Seeded once; the duration effect below resets it on every change.
  let remaining = untrack(() => duration);
  let startedAt = 0;

  function clearTimer() {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
  }

  function start() {
    if (duration <= 0 || remaining <= 0 || timer !== undefined) return;
    startedAt = Date.now();
    timer = setTimeout(() => onclose?.("timeout"), remaining);
  }

  function pause() {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    remaining -= Date.now() - startedAt;
  }

  // Region-driven pause: hold while `paused`, resume when released. Only
  // `paused` drives it: a duration change is the next effect's job.
  $effect.pre(() => {
    const hold = paused;
    untrack(() => (hold ? pause() : start()));
  });

  // (Re)initialise the countdown whenever the duration changes.
  $effect.pre(() => {
    const next = duration;
    untrack(() => resetForDuration(next));
  });
  function resetForDuration(d: number) {
    clearTimer();
    remaining = d;
    if (!paused) start();
  }

  onDestroy(clearTimer);

  // Action clicks run the handler, then dismiss unless told to stay open.
  const alertActions = $derived(
    actions?.map((action) => ({
      label: action.label,
      // Ghost by default, like the inline banner: the action must not outweigh
      // the message (override per action when one must stand out).
      variant: action.variant ?? "ghost",
      onClick: () => {
        action.onClick?.();
        if (!action.keepOpen) onclose?.("action");
      },
    })),
  );
</script>

<!-- No wrapper: the InlineNotification is the live region (it carries
     role="status"/"alert"). -->
<InlineNotification
  {status}
  title={title ?? ""}
  description={text ?? ""}
  {role}
  {closable}
  {inverted}
  {snack}
  {component}
  {componentProps}
  {iconShape}
  {iconBox}
  actions={alertActions}
  onclose={() => onclose?.("user")}
  {icon}
/>
