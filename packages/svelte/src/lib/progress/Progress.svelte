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
  /** Shape: a linear `bar` (default) or a `circle` ring (upload/export). */
  export let shape: "bar" | "circle" = "bar";
  /** Show the percentage inside the circle (determinate `circle` only). */
  export let showValue = false;
  /** Accessible name for the progress bar. */
  export let label: string;

  const { rootAction, indicatorAction, percentage } = createProgress({ value, min, max });
  $: width = $percentage == null ? 100 : $percentage;
  // r=15.9155 makes the circumference 100, so dasharray maps 1:1 to percent.
  const R = 15.9155;
</script>

{#if shape === "circle"}
  <div class="progress progress--circle" use:rootAction aria-label={label}>
    <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      <circle class="progress__track" cx="18" cy="18" r={R} />
      <circle
        class="progress__ring"
        use:indicatorAction
        cx="18"
        cy="18"
        r={R}
        style="stroke-dasharray: {$percentage == null ? 25 : $percentage} 100;"
      />
    </svg>
    {#if showValue && $percentage != null}
      <span class="progress__value">{Math.round($percentage)}%</span>
    {/if}
  </div>
{:else}
  <div class="progress" use:rootAction aria-label={label}>
    <div class="progress__indicator" use:indicatorAction style="inline-size: {width}%;"></div>
  </div>
{/if}

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
    background: var(--ds-progress-fill, var(--ds-color-text, #1c1917));
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

  /* Circle: a ring whose stroke fills clockwise from 12 o'clock. */
  .progress--circle {
    position: relative;
    display: inline-grid;
    place-items: center;
    inline-size: var(--ds-progress-circle-size, 3rem);
    block-size: var(--ds-progress-circle-size, 3rem);
    background: none;
    overflow: visible;
  }
  .progress--circle svg {
    inline-size: 100%;
    block-size: 100%;
    transform: rotate(-90deg);
  }
  .progress__track,
  .progress__ring {
    fill: none;
    stroke-width: var(--ds-progress-circle-stroke, 3.5);
  }
  .progress__track {
    stroke: var(--ds-progress-track, var(--ds-color-border, #e2e8f0));
  }
  .progress__ring {
    stroke: var(--ds-progress-fill, var(--ds-color-text, #1c1917));
    stroke-linecap: round;
    transition: stroke-dasharray 200ms ease;
  }
  .progress__ring:global([data-state="indeterminate"]) {
    animation: ds-progress-turn 1.2s linear infinite;
    transform-origin: center;
  }
  .progress__value {
    position: absolute;
    font-size: var(--ds-progress-value-size, 0.75em);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  @keyframes ds-progress-turn {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .progress__indicator,
    .progress__indicator:global([data-state="indeterminate"]),
    .progress__ring,
    .progress__ring:global([data-state="indeterminate"]) {
      transition: none;
      animation: none;
    }
  }
</style>
