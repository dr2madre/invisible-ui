<script lang="ts">
  /**
   * NotificationRegion — a fixed, stacking container that renders a notifier's
   * queue. It is an accessible landmark (`role="region"` with a label); each
   * Notice inside is its own live region, so additions are announced.
   *
   * Notices enter and leave with a fly/fade transition and the stack
   * reflows via FLIP. Motion is disabled when the user prefers reduced motion.
   *
   * At most `maxVisible` notifications render at once: new ones always enter
   * and the oldest are dismissed to make room —
   * appear as space frees up (their countdown only starts once visible).
   *
   *   <NotificationRegion {notifier} placement="top-end" />
   */
  import { flip } from "svelte/animate";
  import { SvelteMap } from "svelte/reactivity";
  import { fly } from "svelte/transition";
  import { portal } from "../internal/portal";
  import Notification from "./Notification.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { Notifier } from "./create-notifier";

  const { t } = getI18n();

  export let notifier: Notifier;
  export let placement:
    "top-start" | "top-center" | "top-end" | "bottom-start" | "bottom-center" | "bottom-end" =
    "top-end";
  /** Accessible name for the region landmark. Defaults to the i18n catalog's "Notices". */
  export let label: string | undefined = undefined;
  /** Maximum notices rendered at once. `0` means no limit. */
  export let maxVisible = 3;
  /** Enter/leave/reflow duration in ms. */
  export let duration = 200;

  const prefersReduced =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  $: resolvedLabel = label ?? $t("notificationRegion.label");
  $: motion = prefersReduced ? 0 : duration;
  $: flyY = placement.startsWith("top") ? -16 : 16;
  // New notifications always enter; past the limit the OLDEST leave. Never
  // hold a new notification in an invisible queue.
  $: visible = maxVisible > 0 ? $notifier.slice(-maxVisible) : $notifier;

  // Stable paint order, assigned once per notification: older = higher, so
  // every toast covers the shadow of the one above (the newer one) — and a
  // dismissed toast keeps its slot in the order while it animates out,
  // instead of momentarily tying with a neighbour when indexes shift.
  const paintOrder = new SvelteMap<string, number>();
  let seq = 0;
  $: for (const n of visible) if (!paintOrder.has(n.id)) paintOrder.set(n.id, ++seq);
  const zOf = (id: string) => 100000 - (paintOrder.get(id) ?? 0);
</script>

<!-- Portalled to <body>: a viewport-fixed region must escape ancestor
     stacking contexts (e.g. a layout's `isolation: isolate`), or its z-index
     only competes inside them and headers/content paint above the toasts. -->
<div
  class="notification-region"
  data-placement={placement}
  role="region"
  aria-label={resolvedLabel}
  use:portal
>
  {#each visible as notice (notice.id)}
    <div
      class="notice-slot"
      style:z-index={zOf(notice.id)}
      in:fly={{ y: flyY, duration: motion }}
      out:fly={{ y: flyY, duration: motion }}
      animate:flip={{ duration: motion }}
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
        iconShape={notice.iconShape}
        iconBox={notice.iconBox}
        onclose={() => notifier.dismiss(notice.id)}
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
    overflow: clip;
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
