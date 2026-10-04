import { describe, expect, it } from "vitest";
import { initialState, pageItems } from "./state";
import vectors from "./__vectors__/pagination.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("pagination page list vectors", () => {
  for (const vector of vectors.pages) {
    it(vector.name, () => {
      const state = initialState({
        page: vector.page,
        pageCount: vector.pageCount,
        siblingCount: vector.siblingCount,
        boundaryCount: vector.boundaryCount,
      });
      expect({ page: state.page, items: pageItems(state) }).toEqual(vector.expect);
    });
  }
});
