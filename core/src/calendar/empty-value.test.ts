import { describe, expect, it } from "vitest";
import { initialState } from "./state";

describe("calendar initialState with an empty value", () => {
  it("reads an empty value as nothing selected", () => {
    const state = initialState({ value: "" });
    expect(state.value).toBeNull();
  });

  it("falls back to today, a date the formatters accept", () => {
    const state = initialState({ value: "" });
    expect(Number.isNaN(new Date(`${state.focusedDate}T00:00:00`).getTime())).toBe(false);
  });

  it("reads an empty focusedDate the same way", () => {
    const state = initialState({ value: "2026-06-15", focusedDate: "" });
    expect(state.focusedDate).toBe("2026-06-15");
  });
});
