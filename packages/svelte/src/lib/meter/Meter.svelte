<script lang="ts">
  /**
   * Meter — a styled gauge (WAI-ARIA meter pattern): a track with a fill that
   * reflects a value within a known range (e.g. disk usage, battery). Behaviour
   * and accessibility (role, aria-value*, low/medium/high banding) come from the
   * headless meter (`@nozcadesign/invisible-ui-core`); this layer adds the track, fill and
   * per-level colors.
   *
   * Provide a `label` for the accessible name. Colors, height and radius are
   * themeable via `--iui-meter-*` (per level: `--iui-meter-fill-poor|suboptimal|optimal`).
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
    inline-size: var(--iui-meter-width, 16rem);
    block-size: var(--iui-meter-height, 0.5rem);
    overflow: hidden;
    background: var(--iui-meter-track, var(--iui-components-general-border-default, #bdbdbd));
    border-radius: var(--iui-meter-radius, 999px);
  }
  .meter__indicator {
    block-size: 100%;
    background: var(--iui-meter-fill, var(--iui-colors-brand-primary-default, #7a52cc));
    border-radius: inherit;
    transition: inline-size 200ms ease;
  }
  .meter__indicator:global([data-quality="poor"]) {
    background: var(
      --iui-meter-fill-poor,
      var(--iui-components-general-feedback-danger-solid-background-default, #be3b50)
    );
  }
  .meter__indicator:global([data-quality="suboptimal"]) {
    background: var(
      --iui-meter-fill-suboptimal,
      var(--iui-components-general-feedback-warning-solid-background-default, #c96422)
    );
  }
  .meter__indicator:global([data-quality="optimal"]) {
    background: var(--iui-meter-fill-optimal, var(--iui-pastel-green, #8dcc7a));
  }
  @media (prefers-reduced-motion: reduce) {
    .meter__indicator {
      transition: none;
    }
  }
</style>
