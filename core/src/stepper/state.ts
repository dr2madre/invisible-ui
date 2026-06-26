import type { StepperContext, StepperState, StepStatus } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: StepperContext): StepperState {
  return {
    count: context.count,
    current: clampStep(context.current ?? 0, context.count),
    linear: context.linear ?? true,
    orientation: context.orientation ?? "horizontal",
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-stepper-${++idCounter}`,
  };
}

/** Clamp a step index into `[0, count - 1]` (or `0` when there are no steps). */
export function clampStep(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

/** A step's status relative to the current position. */
export function stepStatus(state: StepperState, index: number): StepStatus {
  if (index < state.current) return "complete";
  if (index === state.current) return "current";
  return "upcoming";
}

/**
 * Whether `index` can be navigated to directly. Disabled steppers allow nothing;
 * in linear mode only the current and completed steps are reachable (advance
 * forward via `next`); non-linear allows any in-range step.
 */
export function canGoTo(state: StepperState, index: number): boolean {
  if (state.disabled) return false;
  if (index < 0 || index >= state.count) return false;
  if (!state.linear) return true;
  return index <= state.current;
}
