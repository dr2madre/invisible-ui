<script lang="ts">
  /**
   * Meter — a styled gauge (WAI-ARIA meter pattern): a track with a fill that
   * reflects a value within a known range (e.g. disk usage, battery). Behaviour
   * and accessibility (role, aria-value*, low/medium/high banding) come from the
   * headless meter (`@design-system/core`); this layer adds the track, fill and
   * per-level colors.
   *
   * Provide a `label` for the accessible name. Colors, height and radius are
   * themeable via `--ds-meter-*` (per level: `--ds-meter-fill-poor|suboptimal|optimal`).
   */
  import { untrack } from "svelte";
  import { createMeter } from "./create-meter";

  interface Props {
    /** Current measured value. */
    value?: number;
    /** Minimum value. */
    min?: number;
    /** Maximum value. */
    max?: number;
    /** Upper bound of the "low" range. */
    low?: number;
    /** Lower bound of the "high" range. */
    high?: number;
    /**
     * Where the good end of the scale is. Defaults to `max`, so more reads as
     * better; set it near `min` for a measure where less is better.
     */
    optimum?: number;
    /** Accessible name for the meter. */
    label: string;
  }

  let { value = 0, min = 0, max = 100, low, high, optimum, label }: Props = $props();

  // Seeded once from the first props; the effect below follows later ones.
  const meter = untrack(() => createMeter({ value, min, max, low, high, optimum }));
  const { rootAction, indicatorAction, percentage } = meter;

  // The machine keeps its own store, so props changed after mount are pushed
  // into it.
  $effect.pre(() => {
    meter.sync({ value, min, max, low, high, optimum });
  });
</script>

<!-- The role is declared here as well as applied by the action, so the
     server-rendered markup is valid before hydration. -->
<div
  class="meter"
  role="meter"
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={Math.min(Math.max(value, min), max)}
  use:rootAction
  aria-label={label}
>
  <div class="meter__indicator" use:indicatorAction style="inline-size: {$percentage}%;"></div>
</div>

<style>
  .meter {
    inline-size: var(--ds-meter-width, 16rem);
    block-size: var(--ds-meter-height, 0.5rem);
    overflow: hidden;
    background: var(--ds-meter-track, var(--ds-color-border, #c7c1b7));
    border-radius: var(--ds-meter-radius, 999px);
  }
  .meter__indicator {
    block-size: 100%;
    background: var(--ds-meter-fill, var(--ds-brand-primary, #7a52cc));
    border-radius: inherit;
    transition: inline-size 200ms ease;
  }
  .meter__indicator:global([data-quality="poor"]) {
    background: var(--ds-meter-fill-poor, var(--ds-color-danger, #be3b50));
  }
  .meter__indicator:global([data-quality="suboptimal"]) {
    background: var(--ds-meter-fill-suboptimal, var(--ds-color-warning, #c96422));
  }
  .meter__indicator:global([data-quality="optimal"]) {
    background: var(--ds-meter-fill-optimal, var(--ds-pastel-green, #8dcc7a));
  }
  @media (prefers-reduced-motion: reduce) {
    .meter__indicator {
      transition: none;
    }
  }
</style>
