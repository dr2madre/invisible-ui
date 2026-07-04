<script lang="ts">
  /**
   * NoticeRegion — a fixed, stacking container that renders a notifier's
   * queue. It is an accessible landmark (`role="region"` with a label); each
   * Notice inside is its own live region, so additions are announced.
   *
   * Notices enter and leave with a fly/fade transition and the stack
   * reflows via FLIP. Motion is disabled when the user prefers reduced motion.
   *
   * At most `maxVisible` notices render at once; the rest stay queued and
   * appear as space frees up (their countdown only starts once visible).
   *
   *   <NoticeRegion {notifier} placement="top-end" />
   */
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import Notice from "./Notice.svelte";
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

  $: resolvedLabel = label ?? $t("noticeRegion.label");
  $: motion = prefersReduced ? 0 : duration;
  $: flyY = placement.startsWith("top") ? -16 : 16;
  $: visible = maxVisible > 0 ? $notifier.slice(0, maxVisible) : $notifier;
</script>

<div class="notice-region" data-placement={placement} role="region" aria-label={resolvedLabel}>
  {#each visible as notice (notice.id)}
    <div
      class="notice-slot"
      in:fly={{ y: flyY, duration: motion }}
      out:fly={{ y: flyY, duration: motion }}
      animate:flip={{ duration: motion }}
    >
      <Notice
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
  .notice-region {
    position: fixed;
    /* Sit above every overlay (dialog/popover/menu top out at ~100) and own a
       self-contained stacking context so notices never slip behind page content. */
    z-index: var(--ds-notice-z, 1000);
    isolation: isolate;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
  .notice-region > :global(*) {
    pointer-events: auto;
  }
  .notice-slot > :global(*) {
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }

  .notice-region:global([data-placement^="top"]) {
    top: 0;
  }
  .notice-region:global([data-placement^="bottom"]) {
    bottom: 0;
    flex-direction: column-reverse;
  }
  .notice-region:global([data-placement$="start"]) {
    inset-inline-start: 0;
  }
  .notice-region:global([data-placement$="end"]) {
    inset-inline-end: 0;
  }
  .notice-region:global([data-placement$="center"]) {
    inset-inline-start: 50%;
    transform: translateX(-50%);
  }

  /* On narrow screens notices span the full width (edge-to-edge with a small
     gutter), regardless of placement — a single column is easier to read and
     tap on a phone than a floating corner card. */
  @media (max-width: 30rem) {
    .notice-region,
    .notice-region:global([data-placement$="start"]),
    .notice-region:global([data-placement$="end"]),
    .notice-region:global([data-placement$="center"]) {
      inline-size: 100%;
      inset-inline: 0;
      transform: none;
    }
  }
</style>
