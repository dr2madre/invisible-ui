import { describe, expect, it } from "vitest";
import { localeDirection } from "./locale";
import vectors from "./__vectors__/locale-direction.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("locale direction vectors", () => {
  for (const vector of vectors.directions) {
    it(`${vector.locale} is ${vector.expect}`, () => {
      expect(localeDirection(vector.locale)).toBe(vector.expect);
    });
  }
});
