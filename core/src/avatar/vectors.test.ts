import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";
import vectors from "./__vectors__/initials.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("avatar initials vectors", () => {
  for (const vector of vectors.initials) {
    it(vector.name, () => {
      expect(initialsOf(vector.input)).toBe(vector.expect);
    });
  }
});
