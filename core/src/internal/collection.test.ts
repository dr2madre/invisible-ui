import { describe, expect, it } from "vitest";
import { firstEnabled, lastEnabled, nextEnabled, prevEnabled, step } from "./collection";

// The shared walk over a single-select collection: every primitive that moves
// a highlight (menu, select, combobox, tabs, pagination) relies on it skipping
// disabled entries and wrapping around.
const items = [{ value: "a" }, { value: "b", disabled: true }, { value: "c" }];

describe("collection navigation", () => {
  it("finds the first and last enabled entry, skipping disabled ones", () => {
    expect(firstEnabled(items)).toBe("a");
    expect(lastEnabled(items)).toBe("c");
  });

  it("steps over disabled entries and wraps around", () => {
    expect(nextEnabled(items, "a")).toBe("c");
    expect(nextEnabled(items, "c")).toBe("a");
    expect(prevEnabled(items, "a")).toBe("c");
    expect(prevEnabled(items, "c")).toBe("a");
  });

  it("starts from the near end when nothing is highlighted yet", () => {
    expect(nextEnabled(items, null)).toBe("a");
    expect(prevEnabled(items, null)).toBe("c");
  });

  it("reports nothing when every entry is disabled, or there are none", () => {
    const allDisabled = [{ value: "a", disabled: true }];
    expect(firstEnabled(allDisabled)).toBeNull();
    expect(nextEnabled(allDisabled, "a")).toBeNull();
    expect(firstEnabled([])).toBeNull();
    expect(step([], null, 1)).toBeNull();
  });
});
