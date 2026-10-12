import { describe, expect, it } from "vitest";
import { percentage, snap, valueFromFraction } from "./state";
import type { SliderState } from "./types";
import vectors from "./__vectors__/slider.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

const state = (value: number, min: number, max: number, step: number): SliderState => ({
  value,
  min,
  max,
  step,
  orientation: "horizontal",
  disabled: false,
  id: "x",
});

describe("slider vectors", () => {
  for (const v of vectors.snap) {
    it(`snap: ${v.name}`, () => {
      expect(snap(v.value, v.min, v.max, v.step)).toBeCloseTo(v.expect, 9);
    });
  }
  for (const v of vectors.percentage) {
    it(`percentage: ${v.name}`, () => {
      expect(percentage(state(v.value, v.min, v.max, 1))).toBeCloseTo(v.expect, 9);
    });
  }
  for (const v of vectors.fraction) {
    it(`fraction: ${v.name}`, () => {
      expect(valueFromFraction(state(v.min, v.min, v.max, v.step), v.fraction)).toBeCloseTo(
        v.expect,
        9,
      );
    });
  }
});
