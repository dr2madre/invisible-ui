import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import {
  effectiveMinDistance,
  clampPair,
  initialState,
  normalizePair,
  percentages,
  snap,
} from "./state";

const make = (overrides = {}) => initialState({ id: "x", ...overrides });

describe("range slider state", () => {
  it("defaults to [min, max] over 0-100 step 1", () => {
    const s = initialState();
    expect(s.value).toEqual([0, 100]);
    expect(s.min).toBe(0);
    expect(s.max).toBe(100);
    expect(s.step).toBe(1);
    expect(s.minDistance).toBe(0);
  });

  it("snaps and clamps an initial value pair", () => {
    expect(make({ value: [7, 93], step: 5 }).value).toEqual([5, 95]);
    expect(make({ value: [-5, 999] }).value).toEqual([0, 100]);
  });

  it("normalizes an invalid default: lower is given, upper is clamped against it", () => {
    // lower=50, upper=52, minDistance=10: upper alone is below the legal
    // floor, so upper moves; lower is never touched by this normalization.
    expect(normalizePair([50, 52], 0, 100, 1, 10)).toEqual([50, 60]);
  });

  it("slides the pair down when there is no room above for the distance", () => {
    // [95, 96] over 0-100 with a distance of 10: upper cannot rise to 105,
    // so it stops at max and lower is the one that gives. Keeping lower at
    // 95 would leave the pair 5 apart, which no drag could ever produce.
    expect(normalizePair([95, 96], 0, 100, 1, 10)).toEqual([90, 100]);
    // With room above, lower is still taken as given and upper makes room.
    expect(normalizePair([50, 52], 0, 100, 1, 10)).toEqual([50, 60]);
  });

  it("computes percentages, one per thumb", () => {
    expect(percentages(make({ value: [25, 75] }))).toEqual([25, 75]);
    expect(percentages(make({ value: [2, 6], min: 0, max: 8 }))).toEqual([25, 75]);
  });

  it("rounds minDistance up to the step grid, never down", () => {
    // A request of 4 on a step of 10 is a request for at least 4: the next
    // reachable distance is 10, and 0 would let the thumbs sit closer than
    // was asked.
    expect(effectiveMinDistance(7, 0, 100, 10)).toBe(10);
    expect(effectiveMinDistance(4, 0, 100, 10)).toBe(10);
    expect(effectiveMinDistance(10, 0, 100, 10)).toBe(10);
    expect(effectiveMinDistance(-3, 0, 100, 10)).toBe(0);
    expect(effectiveMinDistance(0, 0, 100, 10)).toBe(0);
    expect(Object.is(effectiveMinDistance(0, 0, 100, 10), 0), "+0, not -0").toBe(true);
  });

  it("orders reversed bounds instead of building an impossible pair", () => {
    const s = make({ min: 100, max: 0, value: [30, 70] });
    expect([s.min, s.max]).toEqual([0, 100]);
    expect(s.value).toEqual([30, 70]);
    expect(make({ min: Number.NaN, max: 10 }).min).toBe(0);
  });

  it("keeps a float-step dependent bound exactly on the grid", () => {
    // 0.9 - 0.3 is 0.6000000000000001 in floating point: clamping there would
    // put a thumb off the grid, report a change that is not one, and paint an
    // unreadable bound. Exact equality on purpose.
    expect(clampPair([0.6, 0.9], 0, 1, 0, 1, 0.1, 0.3)).toEqual([0.6, 0.9]);
    expect(clampPair([0.1, 0.4], 0, 1, 0, 1, 0.1, 0.3)).toEqual([0.1, 0.4]);
    expect(clampPair([0.1, 0.4], 1, 0, 0, 1, 0.1, 0.3)).toEqual([0.1, 0.4]);
    // 0.2 + 0.1 is 0.30000000000000004: the floor under the upper thumb.
    expect(clampPair([0.2, 0.5], 1, 0, 0, 1, 0.1, 0.1)).toEqual([0.2, 0.3]);
    const api = connect({
      state: make({ min: 0, max: 1, step: 0.1, minDistance: 0.3, value: [0.6, 0.9] }),
      setValue: () => {},
    });
    expect(api.getThumbProps(1)["aria-valuemin"]).toBe(0.9);
    expect(api.getThumbProps(0)["aria-valuemax"]).toBe(0.6);
  });

  it("caps the effective distance at what the grid can hold between min and max", () => {
    expect(effectiveMinDistance(10, 0, 100, 1)).toBe(10);
    expect(effectiveMinDistance(4, 0, 100, 10)).toBe(10);
    expect(effectiveMinDistance(250, 0, 100, 1), "wider than the span").toBe(100);
    expect(effectiveMinDistance(100, 0, 95, 10), "span not on the grid").toBe(90);
    expect(effectiveMinDistance(0.25, 0, 1, 0.1)).toBe(0.3);
    expect(effectiveMinDistance(Number.NaN, 0, 100, 1)).toBe(0);
    expect(effectiveMinDistance(5, 0, 100, 0), "no grid: only the cap").toBe(5);
    expect(effectiveMinDistance(500, 0, 100, 0)).toBe(100);
  });

  it("snaps cleanly for fractional steps", () => {
    expect(snap(0.27, 0, 1, 0.1)).toBe(0.3);
  });
});

describe("clampPair: thumbs never cross, identity never swaps", () => {
  it("clamps the lower thumb against the upper thumb minus minDistance", () => {
    // A value that genuinely would cross without the clamp, not merely
    // approach the boundary.
    expect(clampPair([20, 60], 0, 90, 0, 100, 1, 5)).toEqual([55, 60]);
  });

  it("clamps the upper thumb against the lower thumb plus minDistance", () => {
    expect(clampPair([20, 60], 1, 5, 0, 100, 1, 5)).toEqual([20, 25]);
  });

  it("never writes the thumb it did not move", () => {
    const before: readonly [number, number] = [20, 60];
    const after = clampPair(before, 0, 30, 0, 100, 1, 5);
    expect(after[1]).toBe(before[1]);
  });

  it("allows the thumbs to touch when minDistance is 0", () => {
    expect(clampPair([20, 60], 0, 60, 0, 100, 1, 0)).toEqual([60, 60]);
  });

  it("allows the thumbs to touch, not cross, from equal values with a real gap required", () => {
    // Both start at 50, minDistance=10: lower dragged upward stops at the
    // ceiling, which is exactly the sibling's own value when they are equal
    // and the requested motion runs into a distance requirement of 0 room.
    expect(clampPair([50, 50], 0, 70, 0, 100, 1, 10)[0]).toBeLessThanOrEqual(50);
  });

  it("locks at the boundary even when the requested value overshoots the whole range", () => {
    // A fast flick can report a value past the far edge in one native
    // `input` event; the clamp still lands exactly at the dependent bound,
    // not at the overshot target and not at the far edge.
    expect(clampPair([50, 55], 0, 200, 0, 100, 1, 5)).toEqual([50, 55]);
  });

  it("snaps the requested value before clamping, so the result stays on the step grid", () => {
    // step=10, upper=20, minDistance=5: the dependent ceiling (15) is not a
    // step multiple, but the moved thumb's own snap still applies to its
    // request before the clamp narrows it further.
    const [lower] = clampPair([0, 20], 0, 18, 0, 100, 10, 5);
    expect(lower).toBeLessThanOrEqual(15);
  });

  it("never lets lower exceed upper across a spread of requests", () => {
    for (const raw of [-50, 0, 10, 30, 50, 70, 90, 150]) {
      const [lower, upper] = clampPair([30, 70], 0, raw, 0, 100, 1, 5);
      expect(lower).toBeLessThanOrEqual(upper);
    }
  });
});

describe("range slider connect (two native range inputs)", () => {
  it("exposes both thumbs' native range props with global, unnarrowed bounds", () => {
    const api = connect({ state: make({ value: [20, 80], minDistance: 5 }), setValue: () => {} });
    const lower = api.getThumbProps(0);
    const upper = api.getThumbProps(1);
    expect(lower.type).toBe("range");
    expect(lower.min).toBe(0);
    expect(lower.max).toBe(100); // global max, not narrowed to upper - minDistance
    expect(upper.min).toBe(0); // global min, not narrowed to lower + minDistance
    expect(upper.max).toBe(100);
    expect(api.value).toEqual([20, 80]); // live value stays on the top-level api, not the bag
  });

  it("reports the dependent bound through an explicit aria override, not the native attribute", () => {
    const api = connect({ state: make({ value: [20, 80], minDistance: 5 }), setValue: () => {} });
    const lower = api.getThumbProps(0);
    const upper = api.getThumbProps(1);
    expect(lower["aria-valuemax"]).toBe(75); // upper(80) - minDistance(5)
    expect(lower["aria-valuemin"]).toBe(0);
    expect(upper["aria-valuemin"]).toBe(25); // lower(20) + minDistance(5)
    expect(upper["aria-valuemax"]).toBe(100);
  });

  it("names which thumb is which via a data hook", () => {
    const api = connect({ state: make({ value: [20, 80] }), setValue: () => {} });
    expect(api.getThumbProps(0)["data-thumb"]).toBe("lower");
    expect(api.getThumbProps(1)["data-thumb"]).toBe("upper");
  });

  it("hides the decorative fill from the accessibility tree", () => {
    const api = connect({ state: make(), setValue: () => {} });
    expect(api.rangeProps["aria-hidden"]).toBe("true");
  });

  it("does not expose a trackProps bag: the track hosts the real inputs, it is not decorative", () => {
    const api = connect({ state: make(), setValue: () => {} });
    expect((api as unknown as Record<string, unknown>).trackProps).toBeUndefined();
  });

  it("requests a value through the top-level setValue, per thumb", () => {
    const setValue = vi.fn();
    const api = connect({ state: make({ value: [20, 80] }), setValue });
    api.setValue(0, 30);
    expect(setValue).toHaveBeenCalledWith(0, 30);
  });

  it("does not expose value or an input handler in the thumb bag", () => {
    const api = connect({ state: make({ value: [20, 80] }), setValue: () => {} });
    expect(api.getThumbProps(0).value).toBeUndefined();
    expect(api.getThumbProps(0).onInput).toBeUndefined();
  });

  it("ignores requests when disabled", () => {
    const setValue = vi.fn();
    const api = connect({ state: make({ disabled: true, value: [20, 80] }), setValue });
    api.setValue(0, 50);
    api.setValue(1, 10);
    expect(setValue).not.toHaveBeenCalled();
    expect(api.getThumbProps(0).disabled).toBe(true);
    expect(api.getThumbProps(1).disabled).toBe(true);
  });
});

// The invariants the pair must hold whatever it was handed. Not exhaustive
// enumeration, a sweep over the corners: bounds that do not sit on the grid,
// fractional steps, impossible distances, values off the track, reversed
// pairs, and inputs that are not numbers at all.
describe("normalizePair and clampPair keep the pair's invariants", () => {
  const bounds: Array<[number, number, number]> = [
    [0, 100, 1],
    [0, 100, 10],
    [0, 95, 10],
    [-50, 50, 5],
    [0, 1, 0.1],
    [0, 1, 0.25],
    [2, 2.5, 0.1],
    [0, 3, 0],
    [10, 10, 1],
  ];
  const distances = [0, 1, 4, 10, 0.25, 99, 250, -3, Number.NaN];
  const pairs: Array<[number, number]> = [
    [0, 100],
    [95, 96],
    [96, 95],
    [50, 50],
    [-999, 999],
    [0.23, 0.27],
    [2.44, 2.46],
    [Number.NaN, 50],
    [50, Number.POSITIVE_INFINITY],
    [Number.NEGATIVE_INFINITY, Number.NaN],
  ];

  // Exact, not tolerant: a value is on the grid only if re-snapping it gives
  // back the same number. A tolerance here once hid a float-drift bound.
  const isOnGrid = (value: number, min: number, step: number) => {
    if (step <= 0) return true;
    return snap(value, min, Number.POSITIVE_INFINITY, step) === value;
  };

  const check = (
    label: string,
    [lower, upper]: readonly [number, number],
    min: number,
    max: number,
    step: number,
    distance: number,
  ) => {
    expect(Number.isFinite(lower), `${label}: lower finite`).toBe(true);
    expect(Number.isFinite(upper), `${label}: upper finite`).toBe(true);
    expect(lower, `${label}: lower >= min`).toBeGreaterThanOrEqual(min);
    expect(upper, `${label}: upper <= max`).toBeLessThanOrEqual(max);
    expect(lower, `${label}: lower <= upper`).toBeLessThanOrEqual(upper);
    expect(upper - lower + 1e-9, `${label}: distance held`).toBeGreaterThanOrEqual(distance);
    expect(isOnGrid(lower, min, step), `${label}: lower on grid`).toBe(true);
    expect(isOnGrid(upper, min, step), `${label}: upper on grid`).toBe(true);
  };

  it("normalizePair", () => {
    for (const [min, max, step] of bounds) {
      for (const requested of distances) {
        const distance = effectiveMinDistance(requested, min, max, step);
        expect(distance, `distance finite for ${requested}`).toBeGreaterThanOrEqual(0);
        expect(distance).toBeLessThanOrEqual(Math.max(0, max - min) + 1e-9);
        for (const pair of pairs) {
          const label = `normalize ${JSON.stringify(pair)} in [${min},${max}] step ${step} d ${requested}`;
          check(label, normalizePair(pair, min, max, step, requested), min, max, step, distance);
        }
      }
    }
  });

  it("clampPair, from any legal pair and any raw request", () => {
    for (const [min, max, step] of bounds) {
      for (const requested of distances) {
        const distance = effectiveMinDistance(requested, min, max, step);
        for (const pair of pairs) {
          const legal = normalizePair(pair, min, max, step, requested);
          for (const raw of [-1e9, min, (min + max) / 2, max, 1e9, 0.17, Number.NaN]) {
            for (const moved of [0, 1] as const) {
              const label = `clamp ${moved} to ${raw} from ${JSON.stringify(legal)} in [${min},${max}] step ${step} d ${requested}`;
              const after = clampPair(legal, moved, raw, min, max, step, requested);
              check(label, after, min, max, step, distance);
              // Only the moved thumb is written.
              expect(after[1 - moved], `${label}: sibling untouched`).toBe(legal[1 - moved]);
            }
          }
        }
      }
    }
  });

  it("an impossible distance leaves exactly one legal pair, [min, max]", () => {
    expect(normalizePair([40, 60], 0, 100, 1, 250)).toEqual([0, 100]);
    expect(clampPair([0, 100], 0, 50, 0, 100, 1, 250)).toEqual([0, 100]);
    expect(clampPair([0, 100], 1, 50, 0, 100, 1, 250)).toEqual([0, 100]);
  });
});
