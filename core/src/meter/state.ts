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
