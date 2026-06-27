<script lang="ts">
  /**
   * Meter — a styled gauge (WAI-ARIA meter pattern): a track with a fill that
   * reflects a value within a known range (e.g. disk usage, battery). Behaviour
   * and accessibility (role, aria-value*, low/medium/high banding) come from the
   * headless meter (`@design-system/core`); this layer adds the track, fill and
   * per-level colors.
   *
   * Provide a `label` for the accessible name. Colors, height and radius are
   * themeable via `--ds-meter-*` (per level: `--ds-meter-fill-low|medium|high`).
   */
  import { createMeter } from "./create-meter";

  /** Current measured value. */
  export let value = 0;
  /** Minimum value. */
  export let min = 0;
  /** Maximum value. */
  export let max = 100;
  /** Upper bound of the "low" range. */
  export let low: number | undefined = undefined;
  /** Lower bound of the "high" range. */
  export let high: number | undefined = undefined;
  /** Accessible name for the meter. */
  export let label: string;

  const { rootAction, indicatorAction, percentage } = createMeter({ value, min, max, low, high });
</script>

<div class="meter" use:rootAction aria-label={label}>
  <div class="meter__indicator" use:indicatorAction style="inline-size: {$percentage}%;"></div>
</div>

<style>
  .meter {
    inline-size: var(--ds-meter-width, 16rem);
    block-size: var(--ds-meter-height, 0.5rem);
    overflow: hidden;
    background: var(--ds-meter-track, var(--ds-color-border, #e2e8f0));
    border-radius: var(--ds-meter-radius, 999px);
  }
  .meter__indicator {
    block-size: 100%;
    background: var(--ds-meter-fill, var(--ds-brand-primary, #8dcc7a));
    border-radius: inherit;
    transition: inline-size 200ms ease;
  }
  .meter__indicator:global([data-level="low"]) {
    background: var(--ds-meter-fill-low, #e6735c);
  }
  .meter__indicator:global([data-level="medium"]) {
    background: var(--ds-meter-fill-medium, var(--ds-color-warning-500, #d97706));
  }
  .meter__indicator:global([data-level="high"]) {
    background: var(--ds-meter-fill-high, #8dcc7a);
  }
  @media (prefers-reduced-motion: reduce) {
    .meter__indicator {
      transition: none;
    }
  }
</style>
