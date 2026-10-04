import { useProgress } from "./use-progress";

export interface ProgressProps {
  /** Current value. Progress is determinate; waiting with no value belongs to Loading. */
  value?: number;
  min?: number;
  max?: number;
  /** A linear `bar` (default) or a `circle` ring (an upload or an export). */
  shape?: "bar" | "circle";
  /** Show the percentage inside the circle. */
  showValue?: boolean;
  /** Accessible name for the progress bar. */
  label: string;
}

// r=15.9155 makes the circumference 100, so the dash array maps 1:1 to percent.
const R = 15.9155;

/**
 * Progress: a determinate progress bar (WAI-ARIA progressbar pattern), a
 * track with a fill that shows a value against a total: steps completed, a
 * score, a quota. The role and ARIA value come from the headless progress
 * (`@design-system/core`).
 *
 * There is no indeterminate state on purpose: something that spins without a
 * value is waiting, and waiting is the Loading family's job.
 *
 * `label` names it. Themeable via `--ds-progress-*`.
 */
export function Progress({
  value = 0,
  min,
  max,
  shape = "bar",
  showValue = false,
  label,
}: ProgressProps) {
  const api = useProgress({ value, min, max });
  const pct = api.percentage ?? 0;
  // The fill follows the value and the shared sheet leaves its size to the
  // adapter, so it goes inline as in the other adapters.
  if (shape === "circle") {
    return (
      <div {...api.rootProps} className="progress progress--circle" aria-label={label}>
        <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
          <circle className="progress__track" cx="18" cy="18" r={R} />
          <circle
            {...api.indicatorProps}
            className="progress__ring"
            cx="18"
            cy="18"
            r={R}
            style={{ strokeDasharray: `${pct} 100` }}
          />
        </svg>
        {showValue ? <span className="progress__value">{Math.round(pct)}%</span> : null}
      </div>
    );
  }
  return (
    <div {...api.rootProps} className="progress" aria-label={label}>
      <div
        {...api.indicatorProps}
        className="progress__indicator"
        style={{ inlineSize: `${pct}%` }}
      />
    </div>
  );
}
