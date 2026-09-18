import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import {
  alignMinDistance,
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

  it("does not move lower to satisfy an invalid default", () => {
    // Even when lower is very close to max, only upper (and the clamp) may
    // give: lower is always taken as given.
    expect(normalizePair([95, 96], 0, 100, 1, 10)[0]).toBe(95);
  });

  it("computes percentages, one per thumb", () => {
    expect(percentages(make({ value: [25, 75] }))).toEqual([25, 75]);
    expect(percentages(make({ value: [2, 6], min: 0, max: 8 }))).toEqual([25, 75]);
  });

  it("aligns minDistance onto the step grid", () => {
    expect(alignMinDistance(7, 10)).toBe(10);
    expect(alignMinDistance(4, 10)).toBe(0);
    expect(alignMinDistance(-3, 10)).toBe(0);
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
