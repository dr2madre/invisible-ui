import { describe, expect, it } from "vitest";
import { initialState, toggleValue } from "./state";
import type { AccordionType } from "./types";
import vectors from "./__vectors__/accordion.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("accordion toggle vectors", () => {
  for (const vector of vectors.toggles) {
    it(vector.name, () => {
      const state = initialState({
        items: [{ value: "a" }, { value: "b" }, { value: "c" }],
        value: vector.value,
        type: vector.type as AccordionType | undefined,
        collapsible: vector.collapsible,
      });
      expect(toggleValue(state, vector.toggle)).toEqual(vector.expect);
    });
  }
});
