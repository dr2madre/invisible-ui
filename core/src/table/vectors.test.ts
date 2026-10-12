import { describe, expect, it } from "vitest";
import {
  compareValues,
  nextSort,
  scopeSelectionState,
  sortRows,
  toggleHidden,
  toggleRowSelection,
  toggleScopeSelection,
} from "./state";
import type { RowId, SelectionMode, SortState } from "./types";
import vectors from "./__vectors__/table.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("table sort vectors", () => {
  for (const vector of vectors.nextSort) {
    it(vector.name, () => {
      expect(nextSort(vector.current as SortState | null, vector.key)).toEqual(vector.expect);
    });
  }
  for (const vector of vectors.compareValues) {
    it(vector.name, () => {
      expect(Math.sign(compareValues(vector.a, vector.b))).toBe(vector.expect);
    });
  }
  for (const vector of vectors.sortRows) {
    it(vector.name, () => {
      const rows = vector.rows as Record<string, unknown>[];
      const sorted = sortRows(rows, vector.sort as SortState | null);
      expect(sorted.map((row) => row.id)).toEqual(vector.expect);
    });
  }
});

describe("table selection and visibility vectors", () => {
  for (const vector of vectors.toggleRowSelection) {
    it(vector.name, () => {
      expect(
        toggleRowSelection(
          vector.selected as RowId[],
          vector.id as RowId,
          vector.mode as SelectionMode,
        ),
      ).toEqual(vector.expect);
    });
  }
  for (const vector of vectors.toggleScopeSelection) {
    it(vector.name, () => {
      expect(
        toggleScopeSelection(
          vector.selected as RowId[],
          vector.scope as RowId[],
          vector.mode as SelectionMode,
        ),
      ).toEqual(vector.expect);
    });
  }
  for (const vector of vectors.scopeSelectionState) {
    it(vector.name, () => {
      expect(scopeSelectionState(vector.selected as RowId[], vector.scope as RowId[])).toBe(
        vector.expect,
      );
    });
  }
  for (const vector of vectors.toggleHidden) {
    it(vector.name, () => {
      expect(toggleHidden(vector.hidden, vector.key)).toEqual(vector.expect);
    });
  }
});
