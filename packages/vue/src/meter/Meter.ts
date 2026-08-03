import { defineComponent, h, watch } from "vue";
import { useMeter } from "./use-meter";

export interface MeterProps {
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
  /** Accessible name for the meter (required). */
  label: string;
}

/**
 * Meter — a styled gauge (WAI-ARIA meter pattern), ported from the Svelte
 * adapter: a track with a fill that reflects a value within a known range (e.g.
 * disk usage, battery). Behaviour and accessibility (role, aria-value*,
 * low/medium/high banding) come from the headless meter
 * (`@design-system/core`); this layer adds the track, fill and per-level
 * colors.
 *
 * A meter reports a measurement; for the completion of a task use `Progress`.
 *
 * Provide a `label` for the accessible name. Colors, height and radius are
 * themeable via `--ds-meter-*` (per level: `--ds-meter-fill-low|medium|high`).
 */
export const Meter = defineComponent({
  name: "Meter",
  props: {
    value: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    low: { type: Number, default: undefined },
    high: { type: Number, default: undefined },
    label: { type: String, required: true },
  },
  setup(props) {
    const { api, percentage, setValue } = useMeter({
      value: props.value,
      min: props.min,
      max: props.max,
      low: props.low,
      high: props.high,
    });
    watch(
      () => props.value,
      (value) => setValue(value),
    );

    return () =>
      h("div", { ...api.value.rootProps, class: "meter", "aria-label": props.label }, [
        h("div", {
          ...api.value.indicatorProps,
          class: "meter__indicator",
          style: { inlineSize: `${percentage.value}%` },
        }),
      ]);
  },
});
