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
  import { onDestroy } from "svelte";
  import InlineNotification from "../inline-notification/InlineNotification.svelte";
  import type { NotificationAction, NotificationStatus } from "./create-notifier";

  /** Feedback status: `info` | `success` | `warning` | `danger` | `neutral`. */
  export let status: NotificationStatus = "info";
  export let title: string | undefined = undefined;
  export let text: string | undefined = undefined;
  /** Auto-dismiss delay in ms — opt-in. `0` (default) keeps it until closed. */
  export let duration = 0;
  export let closable = true;
  export let role: "status" | "alert" = "status";
  export let actions: NotificationAction[] | undefined = undefined;
  /**
   * High-contrast inverse surface for maximum visibility. Recommended for
   * transient info outcomes that auto-dismiss (saved, offline, downtime…).
   */
  export let inverted = false;
  /** Snackbar layout: one compact row (icon + title + inline action), no description. */
  export let snack = false;
  /** Shape of the FeedbackIcon box — `"rounded"` (default) or a full `"round"` circle. */
  export let iconShape: "rounded" | "round" = "rounded";
  /** FeedbackIcon box override (see InlineNotification): force `"tint"`/`"solid"` on a tinted surface. */
  export let iconBox: "tint" | "transparent" | "solid" | undefined = undefined;
  /** Called when the notification is dismissed (auto, close button, or action). */
  export let onclose: (() => void) | undefined = undefined;
  /**
   * Hold the auto-dismiss countdown (the region sets this while the whole stack
   * is hovered or focused, so a burst of toasts pauses together — not just the
   * one under the pointer).
   */
  export let paused = false;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let remaining = duration;
  let startedAt = 0;

  function clearTimer() {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
  }

  function start() {
    if (duration <= 0 || remaining <= 0 || timer !== undefined) return;
    startedAt = Date.now();
    timer = setTimeout(() => onclose?.(), remaining);
  }

  function pause() {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    remaining -= Date.now() - startedAt;
  }

  // Region-driven pause: hold while `paused`, resume when released.
  $: if (paused) pause();
  else start();

  // (Re)initialise the countdown whenever the duration changes.
  $: resetForDuration(duration);
  function resetForDuration(d: number) {
    clearTimer();
    remaining = d;
    if (!paused) start();
  }

  onDestroy(clearTimer);

  // Action clicks run the handler, then dismiss unless told to stay open.
  $: alertActions = actions?.map((action) => ({
    label: action.label,
    // Ghost by default, like the inline banner: the action must not outweigh
    // the message (override per action when one must stand out).
    variant: action.variant ?? "ghost",
    onClick: () => {
      action.onClick?.();
      if (!action.keepOpen) onclose?.();
    },
  }));
</script>

<!-- No wrapper: the Alert is the live region. Pause-on-hover/focus listeners
     attach to it directly (it carries role="status"/"alert"). -->
{#if $$slots.icon}
  <InlineNotification
    {status}
    title={title ?? ""}
    description={text ?? ""}
    {role}
    {closable}
    {inverted}
    {snack}
    {iconShape}
    {iconBox}
    actions={alertActions}
    onclose={() => onclose?.()}
  >
    <slot name="icon" slot="icon" />
  </InlineNotification>
{:else}
  <InlineNotification
    {status}
    title={title ?? ""}
    description={text ?? ""}
    {role}
    {closable}
    {inverted}
    {snack}
    {iconShape}
    {iconBox}
    actions={alertActions}
    onclose={() => onclose?.()}
  />
{/if}
