import type { ProgressContext, ProgressState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: ProgressContext = {}): ProgressState {
  return {
    // `undefined` -> determinate 0; an explicit `null` -> indeterminate.
    value: context.value === undefined ? 0 : context.value,
    min: context.min ?? 0,
    max: context.max ?? 100,
    id: context.id ?? `ds-progress-${++idCounter}`,
  };
}

/** Whether the bar represents work of unknown length. */
export const isIndeterminate = (state: ProgressState) => state.value === null;

/** Clamp a value into the `[min, max]` range. */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Completion as a 0–100 percentage, or `null` when indeterminate. */
export function percentage(state: ProgressState): number | null {
  if (state.value === null) return null;
  const span = state.max - state.min;
  if (span <= 0) return 0;
  return ((clamp(state.value, state.min, state.max) - state.min) / span) * 100;
}

/** Discrete lifecycle state for styling hooks. */
export function dataState(state: ProgressState): "indeterminate" | "loading" | "complete" {
  if (state.value === null) return "indeterminate";
  return clamp(state.value, state.min, state.max) >= state.max ? "complete" : "loading";
}
