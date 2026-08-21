import type { MeterContext, MeterState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: MeterContext = {}): MeterState {
  return {
    value: context.value ?? 0,
    min: context.min ?? 0,
    max: context.max ?? 100,
    low: context.low ?? null,
    high: context.high ?? null,
    optimum: context.optimum ?? context.max ?? 100,
    id: context.id ?? `ds-meter-${++idCounter}`,
  };
}

/** Clamp a value into the `[min, max]` range. */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Filled fraction as a 0–100 percentage. */
export function percentage(state: MeterState): number {
  const span = state.max - state.min;
  if (span <= 0) return 0;
  return ((clamp(state.value, state.min, state.max) - state.min) / span) * 100;
}

/** Band the value falls into, relative to the optional low/high thresholds. */
export function level(state: MeterState): "low" | "medium" | "high" {
  const v = clamp(state.value, state.min, state.max);
  if (state.low !== null && v <= state.low) return "low";
  if (state.high !== null && v >= state.high) return "high";
  return "medium";
}

/**
 * How good the current value is, which is what a reader actually needs: the
 * same band means opposite things for battery and for disk usage. Follows the
 * native `<meter>` rule: whichever band `optimum` sits in is the good one, the
 * band next to it is middling, and the far one is bad.
 */
export function quality(state: MeterState): "optimal" | "suboptimal" | "poor" {
  const band = level(state);
  const optimumBand = level({ ...state, value: state.optimum });
  if (band === optimumBand) return "optimal";
  // With the good end in the middle, neither outer band is the worst case.
  if (optimumBand === "medium") return "suboptimal";
  return band === "medium" ? "suboptimal" : "poor";
}
