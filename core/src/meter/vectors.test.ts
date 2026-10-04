import { describe, expect, it } from "vitest";
import { initialState, level, percentage, quality } from "./state";
import vectors from "./__vectors__/meter.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

interface Reading {
  name: string;
  value: number;
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  optimum?: number;
  expect: { percentage: number; level: string; quality: string };
}

describe("meter reading vectors", () => {
  for (const vector of vectors.readings as Reading[]) {
    it(vector.name, () => {
      const { name: _name, expect: expected, ...context } = vector;
      const state = initialState(context);
      expect(percentage(state)).toBeCloseTo(expected.percentage, 9);
      expect(level(state)).toBe(expected.level);
      expect(quality(state)).toBe(expected.quality);
    });
  }
});
