import type { RangeSliderContext, RangeSliderState } from "./types";

let idCounter = 0;

/** Clamp a value into the `[min, max]` range. */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Round away floating-point drift from a `step` multiplication or a sum of
 * two grid values: `0.9 - 0.3` is `0.6000000000000001`, which is not a point
 * the arrows can land on.
 */
export const onGrid = (value: number, step: number): number => {
  if (step <= 0) return value;
  const decimals = (String(step).split(".")[1] ?? "").length;
  return decimals ? Number(value.toFixed(decimals)) : value;
};

/**
 * Snap a value to the nearest step (anchored at `min`) and keep it inside the
 * bounds. Past `max` the value steps *down* to the last grid point at or below
 * `max`, not onto `max` itself: a `max` the grid does not reach (95 on a step
 * of 10) is not a value a native range input ever offers, and landing there
 * would put the pair off the grid the arrows move on.
 */
export function snap(value: number, min: number, max: number, step: number): number {
  // A value that is not a number has no place on the track; the low end is
  // the one deterministic answer that is always inside the bounds.
  const safe = Number.isFinite(value) ? value : min;
  if (step <= 0) return clamp(safe, min, max);
  const snapped = onGrid(min + Math.round((safe - min) / step) * step, step);
  if (snapped > max)
    return Math.max(min, onGrid(min + Math.floor((max - min) / step) * step, step));
  return Math.max(min, snapped);
}

/**
 * The distance the two thumbs really keep apart. Two rules turn the request
 * into a distance the pair can actually hold:
 *
 * - it is rounded *up* to the step grid, never down: a consumer asking for
 *   at least 10 on a step of 3 must get 12, not 9, or the pair could sit
 *   closer than was asked;
 * - it is capped at the widest distance the grid can hold between `min` and
 *   `max`, so an impossible request (a distance wider than the span) leaves
 *   exactly one legal pair, `[min, max]`, instead of an unreachable rule.
 *
 * With `step <= 0` there is no grid, and only the cap applies.
 */
export function effectiveMinDistance(
  minDistance: number,
  min: number,
  max: number,
  step: number,
): number {
  const span = Math.max(0, max - min);
  const wanted = Number.isFinite(minDistance) ? Math.max(0, minDistance) : 0;
  if (step <= 0) return Math.min(wanted, span);
  const gridSpan = onGrid(Math.floor(span / step) * step, step);
  // `Math.ceil` of a tiny negative yields -0; `Math.max` with +0 settles it.
  const up = Math.max(0, onGrid(Math.ceil(wanted / step - 1e-9) * step, step));
  return Math.min(up, gridSpan);
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
  const aligned = effectiveMinDistance(minDistance, min, max, step);
  const requested = snap(raw, min, max, step);
  // The bound is the sibling's value plus or minus the distance, both on the
  // grid; their sum is not, in floating point, so it is put back on it.
  if (moved === 0) {
    const ceiling = onGrid(value[1] - aligned, step);
    const lower = Math.min(requested, ceiling);
    return [Math.max(min, lower), value[1]];
  }
  const floor = onGrid(value[0] + aligned, step);
  const upper = Math.max(requested, floor);
  return [value[0], Math.min(max, upper)];
}

/**
 * Normalize an incoming pair the same way a user's own drag would be
 * normalized, and so that the result always satisfies the pair's invariants:
 * both values finite, on the step grid and inside `[min, max]`,
 * `lower <= upper`, and `upper - lower` at least the effective distance.
 *
 * `lower` is taken as given where that is possible and `upper` is pushed up
 * to make room; when there is no room above (`[95, 96]` over 0-100 with a
 * distance of 10), `upper` stops at `max` and `lower` is the one that moves,
 * down to `max - distance`. Used for the initial value, for a controlled prop
 * reflected in from outside, and for a constraint that changed after mount,
 * so the DOM default and the JS state are built from the same call and
 * cannot disagree.
 */
export function normalizePair(
  value: readonly [number, number],
  min: number,
  max: number,
  step: number,
  minDistance: number,
): readonly [number, number] {
  const distance = effectiveMinDistance(minDistance, min, max, step);
  let lower = snap(value[0], min, max, step);
  let upper = Math.max(snap(value[1], min, max, step), lower);
  const short = () => onGrid(upper - lower, step) < distance;
  if (short()) upper = snap(lower + distance, min, max, step);
  if (short()) {
    // No room above: the pair slides down, `upper` at the top of the track.
    upper = snap(max, min, max, step);
    lower = snap(upper - distance, min, max, step);
  }
  return [lower, upper];
}

/** `[min, max]` with the smaller number first; a `NaN` bound falls to 0. */
export function orderBounds(min: number, max: number): readonly [number, number] {
  const a = Number.isFinite(min) ? min : 0;
  const b = Number.isFinite(max) ? max : 0;
  return a <= b ? [a, b] : [b, a];
}

/** Build the initial state from user context. */
export function initialState(context: RangeSliderContext = {}): RangeSliderState {
  // Reversed bounds are a consumer mistake with one deterministic reading:
  // the smaller number is `min`. Every invariant below assumes `min <= max`.
  const [min, max] = orderBounds(context.min ?? 0, context.max ?? 100);
  const step = context.step ?? 1;
  const minDistance = effectiveMinDistance(context.minDistance ?? 0, min, max, step);
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
