<script lang="ts">
  /**
   * Progress — a styled progress bar (WAI-ARIA progressbar pattern): a track
   * with a fill that reflects completion. Behaviour and accessibility (role,
   * aria-value*, determinate vs indeterminate) come from the headless progress
   * (`@design-system/core`); this layer adds the track, fill and an
   * indeterminate sweep animation.
   *
   * Provide a `label` for the accessible name. Colors, height and radius are
   * themeable via `--ds-progress-*`.
   */
  import { createProgress } from "./create-progress";

  /** Current value; pass `null` for an indeterminate bar. */
  export let value: number | null = 0;
  /** Minimum value. */
  export let min = 0;
  /** Maximum value. */
  export let max = 100;
  /** Accessible name for the progress bar. */
  export let label: string;

  const { rootAction, indicatorAction, percentage } = createProgress({ value, min, max });
  $: width = $percentage == null ? 100 : $percentage;
</script>

<div class="progress" use:rootAction aria-label={label}>
  <div class="progress__indicator" use:indicatorAction style="inline-size: {width}%;"></div>
</div>

<style>
  .progress {
    inline-size: var(--ds-progress-width, 16rem);
    block-size: var(--ds-progress-height, 0.5rem);
    overflow: hidden;
    background: var(--ds-progress-track, var(--ds-color-border, #e2e8f0));
    border-radius: var(--ds-progress-radius, 999px);
  }
  .progress__indicator {
    block-size: 100%;
    background: var(--ds-progress-fill, var(--ds-color-primary-500, #2563eb));
    border-radius: inherit;
    transition: inline-size 200ms ease;
  }
  .progress__indicator:global([data-state="indeterminate"]) {
    inline-size: 40% !important;
    animation: ds-progress-sweep 1.2s ease-in-out infinite;
  }
  @keyframes ds-progress-sweep {
    0% {
      transform: translateX(-120%);
    }
    100% {
      transform: translateX(320%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .progress__indicator,
    .progress__indicator:global([data-state="indeterminate"]) {
      transition: none;
      animation: none;
    }
  }
</style>
