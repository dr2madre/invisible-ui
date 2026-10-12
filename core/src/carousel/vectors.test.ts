import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { canGoNext, canGoPrev, initialState, nextIndex, prevIndex } from "./state";
import type { Orientation } from "./types";
import vectors from "./__vectors__/carousel.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("carousel navigation vectors", () => {
  for (const vector of vectors.states) {
    it(vector.name, () => {
      const state = initialState({ count: vector.count, index: vector.index, loop: vector.loop });
      expect({
        index: state.index,
        next: nextIndex(state),
        prev: prevIndex(state),
        canGoNext: canGoNext(state),
        canGoPrev: canGoPrev(state),
      }).toEqual(vector.expect);
    });
  }
});

describe("carousel keyboard vectors", () => {
  for (const vector of vectors.keys) {
    it(vector.name, () => {
      const state = initialState({
        count: vector.count,
        index: vector.index,
        loop: vector.loop,
        orientation: vector.orientation as Orientation,
      });
      let index = state.index;
      const api = connect({
        state,
        setIndex: (next) => (index = next),
        direction: vector.direction as "ltr" | "rtl",
      });
      const onKeyDown = api.rootProps.onKeyDown as (event: Event) => void;
      onKeyDown({ key: vector.key, preventDefault() {} } as unknown as Event);
      expect(index).toBe(vector.expect);
    });
  }
});
