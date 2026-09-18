import type { RangeSliderContext, RangeSliderState } from "./types";

let idCounter = 0;

/** Clamp a value into the `[min, max]` range. */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Snap a value to the nearest step (anchored at `min`) and clamp it. */
export function snap(value: number, min: number, max: number, step: number): number {
  if (step <= 0) return clamp(value, min, max);
  const snapped = min + Math.round((value - min) / step) * step;
  // Guard against floating-point drift from the multiplication.
  const decimals = (String(step).split(".")[1] ?? "").length;
  const rounded = decimals ? Number(snapped.toFixed(decimals)) : snapped;
  return clamp(rounded, min, max);
}

/** `minDistance`, forced onto the step grid: the bound a thumb clamps
 * against must always itself be a point the step could land on, or a clamp
 * and a later re-snap could disagree about which grid point wins. */
export function alignMinDistance(minDistance: number, step: number): number {
  if (step <= 0) return Math.max(0, minDistance);
  return Math.max(0, Math.round(minDistance / step) * step);
}

/**
 * Put one thumb's requested raw value onto the step grid, then clamp it
 * against the *other* thumb's current value plus the required distance.
 * Only the moved index is ever written; the other index's own value is read,
 * never touched. This is a clamp, not positional continuity with the
 * pointer: a fast drag that overshoots the boundary in one native `input`
 * event settles exactly at the boundary, which can be behind where the
 * cursor physically is. Identity never swaps: `lower` stays `value[0]`,
 * `upper` stays `value[1]`, even when the two touch.
 *
 * Two independent, genuinely simultaneous drags (one pointer per thumb) are
 * not resolved by this function: each call only knows the state at the
 * moment it runs, and the settled pair after such a gesture depends on the
 * order the browser dispatches the two inputs' own events, which this
 * function does not and cannot control.
 */
export function clampPair(
  value: readonly [number, number],
  moved: 0 | 1,
  raw: number,
  min: number,
  max: number,
  step: number,
  minDistance: number,
): readonly [number, number] {
  const aligned = alignMinDistance(minDistance, step);
  const requested = snap(raw, min, max, step);
  if (moved === 0) {
    const ceiling = value[1] - aligned;
    const lower = Math.min(requested, ceiling);
    return [Math.max(min, lower), value[1]];
  }
  const floor = value[0] + aligned;
  const upper = Math.max(requested, floor);
  return [value[0], Math.min(max, upper)];
}

/**
 * Normalize an incoming pair the same way a user's own drag would be
 * normalized: `lower` is taken as given, `upper` is clamped against it. Used
 * both for the initial value and for a controlled prop reflected in from
 * outside, so a consumer's invalid pair (closer together than `minDistance`
 * allows) still resolves to a legal one, deterministically, and the DOM
 * default and the JS state are built from the same call so they cannot
 * disagree.
 */
export function normalizePair(
  value: readonly [number, number],
  min: number,
  max: number,
  step: number,
  minDistance: number,
): readonly [number, number] {
  const lower = snap(value[0], min, max, step);
  const aligned = alignMinDistance(minDistance, step);
  const upper = Math.max(snap(value[1], min, max, step), Math.min(max, lower + aligned));
  return [lower, Math.min(max, upper)];
}

/** Build the initial state from user context. */
export function initialState(context: RangeSliderContext = {}): RangeSliderState {
  const min = context.min ?? 0;
  const max = context.max ?? 100;
  const step = context.step ?? 1;
  const minDistance = alignMinDistance(context.minDistance ?? 0, step);
  const value = normalizePair(context.value ?? [min, max], min, max, step, minDistance);
  return {
    value,
    min,
    max,
    step,
    minDistance,
    orientation: context.orientation ?? "horizontal",
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-range-slider-${++idCounter}`,
  };
}

/** Filled fraction as a 0-100 percentage, one per thumb. */
export function percentages(state: RangeSliderState): readonly [number, number] {
  const span = state.max - state.min;
  if (span <= 0) return [0, 0];
  return [((state.value[0] - state.min) / span) * 100, ((state.value[1] - state.min) / span) * 100];
}
