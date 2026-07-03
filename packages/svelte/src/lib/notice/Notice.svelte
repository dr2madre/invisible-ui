<script lang="ts">
  /**
   * Notice — an ephemeral, auto-dismissing Alert, meant to be stacked
   * inside a `NoticeRegion`. It reuses the Alert for its anatomy and
   * accessibility (it *is* the live region — there is no extra wrapper), and
   * adds timing:
   *
   * - Auto-dismisses after `duration` ms (`0` keeps it until closed). The timer
   *   restarts if `duration` changes (e.g. a promise notice swapping
   *   loading → success).
   * - The countdown pauses while the notice is hovered or focused (so
   *   action buttons can be used), per WCAG 2.2.1 Timing. The pause listeners
   *   sit on the Alert's live region itself — the element the user interacts
   *   with — so no presentational wrapper is needed.
   * - Closable by default; supports action buttons that dismiss on click.
   *
   * Enter/leave motion and elevation are handled by `NoticeRegion`.
   */
  import { onDestroy } from "svelte";
  import Alert from "../alert/Alert.svelte";
  import type { NoticeAction, NoticeStatus } from "./create-notifier";

  /** Feedback status: `info` | `success` | `warning` | `danger` | `neutral`. */
  export let status: NoticeStatus = "info";
  export let title: string | undefined = undefined;
  export let text: string | undefined = undefined;
  export let duration = 5000;
  export let closable = true;
  export let role: "status" | "alert" = "status";
  export let actions: NoticeAction[] | undefined = undefined;
  /**
   * High-contrast inverse surface for maximum visibility. Recommended for
   * transient info outcomes that auto-dismiss (saved, offline, downtime…).
   */
  export let inverted = false;
  /** Shape of the FeedbackIcon box — `"rounded"` (default) or a full `"round"` circle. */
  export let iconShape: "rounded" | "round" = "rounded";
  /** FeedbackIcon box override (see Alert): force `"tint"`/`"solid"` on a tinted surface. */
  export let iconBox: "tint" | "transparent" | "solid" | undefined = undefined;
  /** Called when the notice is dismissed (auto, close button, or action). */
  export let onclose: (() => void) | undefined = undefined;

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

  // (Re)initialise the countdown whenever the duration changes.
  $: resetForDuration(duration);
  function resetForDuration(d: number) {
    clearTimer();
    remaining = d;
    start();
  }

  onDestroy(clearTimer);

  // Action clicks run the handler, then dismiss unless told to stay open.
  $: alertActions = actions?.map((action) => ({
    label: action.label,
    // Notices default to the white `default` button (not the Alert's ghost):
    // a transient toast needs a clearly tappable action.
    variant: action.variant ?? "default",
    onClick: () => {
      action.onClick?.();
      if (!action.keepOpen) onclose?.();
    },
  }));
</script>

<!-- No wrapper: the Alert is the live region. Pause-on-hover/focus listeners
     attach to it directly (it carries role="status"/"alert"). -->
{#if $$slots.icon}
  <Alert
    {status}
    title={title ?? ""}
    description={text ?? ""}
    {role}
    {closable}
    {inverted}
    {iconShape}
    {iconBox}
    actions={alertActions}
    onclose={() => onclose?.()}
    on:mouseenter={pause}
    on:mouseleave={start}
    on:focusin={pause}
    on:focusout={start}
  >
    <slot name="icon" slot="icon" />
  </Alert>
{:else}
  <Alert
    {status}
    title={title ?? ""}
    description={text ?? ""}
    {role}
    {closable}
    {inverted}
    {iconShape}
    {iconBox}
    actions={alertActions}
    onclose={() => onclose?.()}
    on:mouseenter={pause}
    on:mouseleave={start}
    on:focusin={pause}
    on:focusout={start}
  />
{/if}
