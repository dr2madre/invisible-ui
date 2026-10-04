import { useMeter } from "./use-meter";

export interface MeterProps {
  /** Current measured value. */
  value?: number;
  min?: number;
  max?: number;
  /** Upper bound of the "low" band. */
  low?: number;
  /** Lower bound of the "high" band. */
  high?: number;
  /**
   * Where the good end of the scale is. Defaults to `max`, so more reads as
   * better; set it near `min` for a measure where less is better.
   */
  optimum?: number;
  /** Accessible name for the meter. */
  label: string;
}

/**
 * Meter: a gauge (WAI-ARIA meter pattern), a track with a fill that shows a
 * value within a known range, such as disk usage or battery. The role, the
 * ARIA value and the low, medium and high bands come from the headless meter
 * (`@design-system/core`); the fill is coloured by how good the value is.
 *
 * A meter reports a measurement; for the completion of a task use
 * `Progress`.
 *
 * `label` names it. Themeable via `--ds-meter-*`.
 */
export function Meter({ value, min, max, low, high, optimum, label }: MeterProps) {
  const api = useMeter({ value, min, max, low, high, optimum });
  return (
    <div {...api.rootProps} className="meter" aria-label={label}>
      <div
        {...api.indicatorProps}
        className="meter__indicator"
        // The fill follows the value and the shared sheet leaves its size to
        // the adapter, so it goes inline as in the other adapters.
        style={{ inlineSize: `${api.percentage}%` }}
      />
    </div>
  );
}
