import { describe, expect, it } from "vitest";
import { nearerThumb, pointerFraction } from "./geometry";
import { clampPair, effectiveMinDistance, normalizePair, orderBounds, snap } from "./state";
import vectors from "./__vectors__/range-slider.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

const pair = (value: number[]) => value as unknown as readonly [number, number];

const expectPair = (got: readonly [number, number], expected: number[]) => {
  const [lower, upper] = pair(expected);
  expect(got[0]).toBeCloseTo(lower, 9);
  expect(got[1]).toBeCloseTo(upper, 9);
};

const box = { left: 10, top: 0, width: 200, height: 100 };

describe("range slider vectors", () => {
  for (const v of vectors.snap) {
    it(`snap: ${v.name}`, () => {
      expect(snap(v.value, v.min, v.max, v.step)).toBeCloseTo(v.expect, 9);
    });
  }
  for (const v of vectors.minDistance) {
    it(`distance: ${v.name}`, () => {
      expect(effectiveMinDistance(v.minDistance, v.min, v.max, v.step)).toBeCloseTo(v.expect, 9);
    });
  }
  for (const v of vectors.clampPair) {
    it(`clampPair: ${v.name}`, () => {
      const moved = v.moved as 0 | 1;
      const got = clampPair(pair(v.value), moved, v.raw, v.min, v.max, v.step, v.minDistance);
      expectPair(got, v.expect);
    });
  }
  for (const v of vectors.normalizePair) {
    it(`normalizePair: ${v.name}`, () => {
      expectPair(normalizePair(pair(v.value), v.min, v.max, v.step, v.minDistance), v.expect);
    });
  }
  for (const v of vectors.orderBounds) {
    it(`orderBounds: ${v.name}`, () => {
      expect(orderBounds(v.min, v.max)).toEqual(v.expect);
    });
  }
  for (const v of vectors.nearerThumb) {
    it(`nearerThumb: ${v.name}`, () => {
      expect(nearerThumb(v.pointer, v.lower, v.upper)).toBe(v.expect);
    });
  }
  for (const v of vectors.pointerFraction) {
    it(`pointerFraction: ${v.name}`, () => {
      const axis = { orientation: v.orientation as "horizontal" | "vertical", rtl: v.rtl };
      expect(pointerFraction(axis, box, v.x, v.y)).toBeCloseTo(v.expect, 9);
    });
  }
});
