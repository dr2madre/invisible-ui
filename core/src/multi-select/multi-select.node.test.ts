// @vitest-environment node
import { describe, expect, it } from "vitest";
import { addValue, initialState } from "./state";

describe("multi select — Node import", () => {
  it("imports and transitions without any DOM", () => {
    expect(typeof document).toBe("undefined");
    const state = initialState({ items: [{ value: "a" }] });
    expect(state.values).toEqual([]);
    expect(addValue(state.values, "a", null)).toEqual(["a"]);
  });
});
