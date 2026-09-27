<script lang="ts">
  /**
   * NotificationRegion — a fixed, stacking container that renders a notifier's
   * queue. It is an accessible landmark (`role="region"` with a label); each
   * Notice inside is its own live region, so additions are announced.
   *
   * Notices enter and leave with a fly/fade transition and the stack
   * reflows via FLIP. Motion is disabled when the user prefers reduced motion.
   *
   * The region spans the full window height and stacks every notification
   * (newest fully visible on top); when the pile would pass the far edge it is
   * clipped there, never at a smaller box. `maxVisible` is an optional count
   * cap for consumers who want one — unset by default, so the window height is
   * the only bound.
   *
   *   <NotificationRegion {notifier} placement="top-end" />
   */
  import { flip } from "svelte/animate";
  import type { Attachment } from "svelte/attachments";
  import { fly } from "svelte/transition";
  import { cubicIn, cubicOut } from "svelte/easing";
  import { portal } from "../internal/portal";
  import { swipeDismiss } from "../internal/swipe";
  import Notification from "./Notification.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { Notifier } from "./create-notifier";

  const { t, locale: i18nLocale, dir: i18nDir } = getI18n();

  interface Props {
    notifier: Notifier;
    placement?:
      "top-start" | "top-center" | "top-end" | "bottom-start" | "bottom-center" | "bottom-end";
    /** Accessible name for the region landmark. Defaults to the i18n catalog's "Notices". */
    label?: string;
    /**
     * Optional cap on notifications rendered at once. `0` (default) means no
     * count cap — the pile fills the window height and clips the oldest at the
     * far edge. Set a number to also limit by count.
     */
    maxVisible?: number;
    /** Distance from the viewport edges, as a CSS length. Default `1rem`. */
    inset?: string;
    /** Allow swiping a notification away (pointer/touch). Default `true`. */
    swipeable?: boolean;
    /** Enter/reflow duration in ms. */
    duration?: number;
    /** Leave duration in ms. Defaults to 1.75× `duration` — a gentler exit. */
    exitDuration?: number;
    /** Easing for enter/reflow. Ease-out by default. */
    easing?: (t: number) => number;
    /**
     * Easing for the leave animation. Ease-in by default: starts slow and
     * accelerates away, so a dismissal never snaps.
     */
    exitEasing?: (t: number) => number;
  }

  let {
    notifier,
    placement = "top-end",
    label,
    maxVisible = 0,
    inset = "1rem",
    swipeable = true,
    duration = 200,
    exitDuration,
    easing = cubicOut,
    exitEasing = cubicIn,
  }: Props = $props();

  // Read after mount and kept in sync with the OS setting: the server cannot
  // know the preference, so the first client render must match its output.
  let prefersReduced = $state(false);
  const followReducedMotion: Attachment<HTMLElement> = () => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => (prefersReduced = query.matches);
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  };

  const resolvedLabel = $derived(label ?? $t("notificationRegion.label"));
  const motion = $derived(prefersReduced ? 0 : duration);
  const motionOut = $derived(prefersReduced ? 0 : (exitDuration ?? Math.round(duration * 1.75)));
  const flyY = $derived(placement.startsWith("top") ? -16 : 16);
  // New notifications always enter; past the limit the OLDEST leave. Never
  // hold a new notification in an invisible queue.
  const visible = $derived(maxVisible > 0 ? $notifier.slice(-maxVisible) : $notifier);

  // Stable paint order, assigned once per notification: older = higher, so
  // every toast covers the shadow of the one above (the newer one) — and a
  // dismissed toast keeps its slot in the order while it animates out,
  // instead of momentarily tying with a neighbour when indexes shift.
  // The order remembers earlier runs, so it lives in a plain map that each
  // new list of notifications updates; the derived hands out a fresh copy,
  // and that copy is what the template reads.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a memo only the derived below reads
  const order = new Map<string, number>();
  let seq = 0;
  // How many dismissed notifications keep their slot: enough to cover the ones
  // still animating out, not enough to grow for the life of the region.
  const RECENT = 8;
  const paintOrder = $derived.by(() => {
    for (const n of visible) if (!order.has(n.id)) order.set(n.id, ++seq);
    const showing = new Set(visible.map((n) => n.id));
    const gone = [...order.keys()].filter((id) => !showing.has(id));
    for (const id of gone.slice(0, Math.max(0, gone.length - RECENT))) order.delete(id);
    // The numbers are then closed up again, so what is left is what is on
    // screen plus a few on their way out. Counting on for the life of the
    // region would push the paint order out of its range.
    let renumbered = 0;
    for (const id of [...order.keys()]) order.set(id, ++renumbered);
    seq = renumbered;
    return new Map(order);
  });
  const zOf = (id: string) => 100000 - (paintOrder.get(id) ?? 0);

  // Pause the WHOLE stack while any notification is hovered or holds focus, so
  // a burst pauses together (not just the one under the pointer). pointerover/
  // out and focusin/out bubble from the interactive slots through the region's
  // pointer-events:none root; leaving is "no longer inside the region".
  let regionEl: HTMLElement | undefined;
  let pointerInside = $state(false);
  let focusInside = $state(false);
  const paused = $derived(pointerInside || focusInside);
  const inside = (target: EventTarget | null) =>
    target instanceof Node && regionEl?.contains(target);
</script>

<!-- Portalled to <body>: a viewport-fixed region must escape ancestor
     stacking contexts (e.g. a layout's `isolation: isolate`), or its z-index
     only competes inside them and headers/content paint above the toasts. -->
<div
  bind:this={regionEl}
  class="notification-region"
  data-placement={placement}
  role="region"
  aria-label={resolvedLabel}
  style:padding={inset}
  onpointerover={() => (pointerInside = true)}
  onpointerout={(e) => {
    if (!inside(e.relatedTarget)) pointerInside = false;
  }}
  onfocusin={() => (focusInside = true)}
  onfocusout={(e) => {
    if (!inside(e.relatedTarget)) focusInside = false;
  }}
  lang={$i18nLocale}
  dir={$i18nDir}
  use:portal
  {@attach followReducedMotion}
>
  {#each visible as notice (notice.id)}
    <div
      class="notice-slot"
      style:z-index={zOf(notice.id)}
      in:fly={{ y: flyY, duration: motion, easing }}
      out:fly={{ y: flyY, duration: motionOut, easing: exitEasing }}
      animate:flip={{ duration: motionOut, easing }}
      use:swipeDismiss={{
        disabled: !swipeable,
        onDismiss: () => notifier.dismiss(notice.id, "user"),
      }}
    >
      <Notification
        status={notice.status}
        title={notice.title}
        text={notice.text}
        duration={notice.duration}
        closable={notice.closable}
        role={notice.role}
        actions={notice.actions}
        inverted={notice.inverted}
        snack={notice.snack}
        component={notice.component}
        componentProps={notice.componentProps}
        {paused}
        iconShape={notice.iconShape}
        iconBox={notice.iconBox}
        onclose={(reason) => notifier.dismiss(notice.id, reason)}
      />
    </div>
  {/each}
</div>

<style>
  .notification-region {
    position: fixed;
    /* Sit above every overlay (dialog/popover/menu top out at ~100) and own a
       self-contained stacking context so notices never slip behind page content. */
    z-index: var(--ds-notice-z, 1000);
    isolation: isolate;
    display: flex;
    gap: 0.5rem;
    /* Newest on top of the pile, always fully visible: the stack never grows
       past the screen — when it would, it slides down and the oldest are
       clipped on the far side. */
    flex-direction: column-reverse;
    justify-content: flex-end;
    max-block-size: 100dvh;
    /* Clip only the block axis (the vertical pile cap); keep the inline axis
       visible so a content-wrapping snack and drop shadows aren't cut, and so
       the exit transform never crosses a clip edge. (clip on one axis + visible
       on the other is a valid combo — visible is not coerced.) */
    overflow-block: clip;
    overflow-inline: visible;
    padding: 1rem;
    inline-size: min(100% - 2rem, var(--ds-notice-width, 24rem));
    /* Let clicks pass through the gaps; notices stay interactive. */
    pointer-events: none;
  }
  /* Each slot holds exactly one Notice (an Alert live region). The slot
     exists for stacking + enter/leave motion, so it is the natural place to
     apply the floating elevation — no presentational wrapper is added. The
     shadow lands on the Alert itself (the slot's only child) so it follows the
     alert's rounded corners; customize via --ds-elevation-overlay. */
  .notification-region > :global(*) {
    pointer-events: auto;
  }
  .notice-slot {
    /* Keep vertical scroll; the horizontal axis is the swipe-to-dismiss gesture. */
    touch-action: pan-y;
  }
  /* While settling (dismiss/snap-back) the transform + fade animate; while
     actively swiping (data-swiping) the element tracks the finger with no
     transition. */
  .notice-slot:global([data-swipe-out]) {
    transition:
      transform 200ms ease,
      opacity 200ms ease;
  }
  .notice-slot > :global(*) {
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }

  .notification-region:global([data-placement^="top"]) {
    top: 0;
  }
  .notification-region:global([data-placement^="bottom"]) {
    bottom: 0;
  }
  .notification-region:global([data-placement$="start"]) {
    inset-inline-start: 0;
  }
  .notification-region:global([data-placement$="end"]) {
    inset-inline-end: 0;
  }
  .notification-region:global([data-placement$="center"]) {
    inset-inline-start: 50%;
    transform: translateX(-50%);
  }

  /* On narrow screens notices span the full width (edge-to-edge with a small
     gutter), regardless of placement — a single column is easier to read and
     tap on a phone than a floating corner card. */
  @media (max-width: 30rem) {
    .notification-region,
    .notification-region:global([data-placement$="start"]),
    .notification-region:global([data-placement$="end"]),
    .notification-region:global([data-placement$="center"]) {
      inline-size: 100%;
      inset-inline: 0;
      transform: none;
    }
  }
</style>
