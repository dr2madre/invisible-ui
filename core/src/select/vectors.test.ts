import { describe, expect, it } from "vitest";
import { firstEnabled, lastEnabled, nextEnabled, prevEnabled } from "../internal/collection";
import { matchOption } from "./state";
import type { SelectItem } from "./types";
import vectors from "./__vectors__/select.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

type Op = "first" | "last" | "next" | "prev" | "typeahead";

function run(items: SelectItem[], op: Op, from: string | null, query = ""): string | null {
  switch (op) {
    case "first":
      return firstEnabled(items);
    case "last":
      return lastEnabled(items);
    case "next":
      return nextEnabled(items, from);
    case "prev":
      return prevEnabled(items, from);
    case "typeahead":
      return matchOption(items, query, from);
  }
}

const items = vectors.items as SelectItem[];

describe("select typeahead vectors", () => {
  for (const vector of vectors.typeahead) {
    it(vector.name, () => {
      expect(matchOption(items, vector.query, vector.from)).toBe(vector.expect);
    });
  }
});

describe("select navigation vectors", () => {
  for (const vector of vectors.navigation) {
    it(vector.name, () => {
      expect(run(items, vector.op as Op, vector.from)).toBe(vector.expect);
    });
  }
});

describe("select vectors with every item disabled", () => {
  const disabled = vectors.disabledOnly.items as SelectItem[];
  for (const vector of vectors.disabledOnly.cases) {
    it(vector.name, () => {
      expect(run(disabled, vector.op as Op, vector.from, vector.query)).toBe(vector.expect);
    });
  }
});
