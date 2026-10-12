import { describe, expect, it } from "vitest";
import { addValue, labelOf, lastRemovableValue, removeValue, resolveItem } from "./state";
import type { MultiSelectItem } from "./types";
import vectors from "./__vectors__/multi-select.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases. `same` says a no-op
// returns the very list it was given, so it can never reach a report.

const items = vectors.items as MultiSelectItem[];

describe("multi select add vectors", () => {
  for (const vector of vectors.add) {
    it(vector.name, () => {
      const result = addValue(vector.values, vector.value, vector.max);
      expect(result).toEqual(vector.expect);
      expect(result === vector.values).toBe(vector.same);
    });
  }
});

describe("multi select remove vectors", () => {
  for (const vector of vectors.remove) {
    it(vector.name, () => {
      const result = removeValue(vector.values, vector.value);
      expect(result).toEqual(vector.expect);
      expect(result === vector.values).toBe(vector.same);
    });
  }
});

describe("multi select Backspace vectors", () => {
  for (const vector of vectors.lastRemovable) {
    it(vector.name, () => {
      expect(lastRemovableValue(vector.values, items)).toBe(vector.expect);
    });
  }
});

describe("multi select fallback vectors", () => {
  for (const vector of vectors.resolve) {
    it(vector.name, () => {
      const item = resolveItem(items, vector.value);
      expect(labelOf(item)).toBe(vector.expect.label);
      expect(item.disabled ?? false).toBe(vector.expect.disabled);
    });
  }
});
