import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { clamp, dataState, isIndeterminate, percentage } from "./state";
import type { ProgressState } from "./types";

/** The public, framework-agnostic API for a connected progress bar. */
export interface ProgressApi {
  /** Current value, or `null` when indeterminate. */
  value: number | null;
  min: number;
  max: number;
  /** Completion as a 0–100 percentage, or `null` when indeterminate. */
  percentage: number | null;
  /** Whether the bar is indeterminate. */
  indeterminate: boolean;
  /** Props for the progressbar element (`role="progressbar"` + ARIA value). */
  rootProps: ElementProps;
  /** Props for the visual fill/indicator (styling hooks). */
  indicatorProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: ProgressState;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect progress state to prop getters following the WAI-ARIA progressbar
 * pattern (https://www.w3.org/WAI/ARIA/apg/patterns/meter/ — progressbar is the
 * one-way variant). A determinate bar exposes `aria-valuenow`; an indeterminate
 * one omits it. The element still needs an accessible name (`aria-label` or
 * `aria-labelledby`), supplied by the consumer.
 */
export function connect({ state, normalize = identityNormalize }: ConnectOptions): ProgressApi {
  const indeterminate = isIndeterminate(state);
  const pct = percentage(state);
  const now = state.value === null ? undefined : clamp(state.value, state.min, state.max);
  const ds = dataState(state);

  return {
    value: state.value,
    min: state.min,
    max: state.max,
    percentage: pct,
    indeterminate,
    rootProps: normalize({
      role: "progressbar",
      "aria-valuemin": state.min,
      "aria-valuemax": state.max,
      "aria-valuenow": now,
      "data-state": ds,
    }),
    indicatorProps: normalize({
      "data-state": ds,
    }),
  };
}
