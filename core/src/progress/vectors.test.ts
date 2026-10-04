import { describe, expect, it } from "vitest";
import { initialState, percentage } from "./state";
import vectors from "./__vectors__/progress.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("progress percentage vectors", () => {
  for (const vector of vectors.percentages) {
    it(vector.name, () => {
      const state = initialState({ value: vector.value, min: vector.min, max: vector.max });
      expect(percentage(state)).toBeCloseTo(vector.expect, 9);
    });
  }
});
