import type { SliderContext, SliderState } from "./types";

let idCounter = 0;

/** Clamp a value into the `[min, max]` range. */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Snap a value to the nearest step (anchored at `min`) and clamp it. */
export function snap(value: number, min: number, max: number, step: number): number {
  if (step <= 0) return clamp(value, min, max);
  const snapped = min + Math.round((value - min) / step) * step;
  // Guard against floating-point drift from the multiplication.
  const decimals = (String(step).split(".")[1] ?? "").length;
  const rounded = decimals ? Number(snapped.toFixed(decimals)) : snapped;
  return clamp(rounded, min, max);
}

/** Build the initial state from user context. */
export function initialState(context: SliderContext = {}): SliderState {
  const min = context.min ?? 0;
  const max = context.max ?? 100;
  const step = context.step ?? 1;
  return {
    value: snap(context.value ?? min, min, max, step),
    min,
    max,
    step,
    orientation: context.orientation ?? "horizontal",
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-slider-${++idCounter}`,
  };
}

/** Filled fraction as a 0–100 percentage. */
export function percentage(state: SliderState): number {
  const span = state.max - state.min;
  if (span <= 0) return 0;
  return ((state.value - state.min) / span) * 100;
}

/** Value at a 0–1 fraction of the track (snapped + clamped). */
export function valueFromFraction(state: SliderState, fraction: number): number {
  return snap(state.min + fraction * (state.max - state.min), state.min, state.max, state.step);
}
