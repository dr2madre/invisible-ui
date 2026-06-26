import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { clamp, level, percentage } from "./state";
import type { MeterState } from "./types";

/** The public, framework-agnostic API for a connected meter. */
export interface MeterApi {
  value: number;
  min: number;
  max: number;
  /** Filled fraction as a 0–100 percentage. */
  percentage: number;
  /** Band relative to the low/high thresholds. */
  level: "low" | "medium" | "high";
  /** Props for the meter element (`role="meter"` + ARIA value). */
  rootProps: ElementProps;
  /** Props for the visual fill/indicator (styling hooks). */
  indicatorProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: MeterState;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect meter state to prop getters following the WAI-ARIA meter pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/meter/): a gauge of a value within
 * a known range (e.g. disk usage, battery). Unlike a progressbar it is not a
 * one-way task indicator. The element needs an accessible name, supplied by the
 * consumer (`aria-label`).
 */
export function connect({ state, normalize = identityNormalize }: ConnectOptions): MeterApi {
  const now = clamp(state.value, state.min, state.max);
  const band = level(state);

  return {
    value: state.value,
    min: state.min,
    max: state.max,
    percentage: percentage(state),
    level: band,
    rootProps: normalize({
      role: "meter",
      "aria-valuemin": state.min,
      "aria-valuemax": state.max,
      "aria-valuenow": now,
      "data-level": band,
    }),
    indicatorProps: normalize({
      "data-level": band,
    }),
  };
}
