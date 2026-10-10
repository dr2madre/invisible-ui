import { describe, expect, it } from "vitest";
import { canGoTo, initialState, stepStatus } from "./state";
import vectors from "./__vectors__/stepper.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("stepper vectors", () => {
  for (const v of vectors.steps) {
    it(v.name, () => {
      const state = initialState({
        count: v.count,
        current: v.current,
        linear: v.linear,
        disabled: v.disabled,
        id: "x",
      });
      const indexes = Array.from({ length: v.count }, (_, i) => i);
      expect(state.current).toBe(v.expect.current);
      expect(indexes.map((i) => stepStatus(state, i))).toEqual(v.expect.status);
      expect(indexes.map((i) => canGoTo(state, i))).toEqual(v.expect.reachable);
    });
  }
});
