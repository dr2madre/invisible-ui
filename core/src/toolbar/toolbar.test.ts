import { describe, expect, it } from "vitest";
import { nextIndex } from "./state";

const move = (key: string, index: number, extra: Record<string, unknown> = {}) =>
  nextIndex({ key, index, count: 3, ...extra });

describe("toolbar keyboard model", () => {
  it("walks forward and back along a horizontal toolbar", () => {
    expect(move("ArrowRight", 0)).toBe(1);
    expect(move("ArrowLeft", 1)).toBe(0);
  });

  it("wraps around at both ends", () => {
    expect(move("ArrowRight", 2)).toBe(0);
    expect(move("ArrowLeft", 0)).toBe(2);
  });

  it("jumps to the ends with Home and End", () => {
    expect(move("Home", 1)).toBe(0);
    expect(move("End", 1)).toBe(2);
  });

  it("uses the vertical arrows when the toolbar is vertical", () => {
    expect(move("ArrowDown", 0, { orientation: "vertical" })).toBe(1);
    expect(move("ArrowUp", 1, { orientation: "vertical" })).toBe(0);
    // The horizontal arrows mean nothing there, so the adapter leaves them be.
    expect(move("ArrowRight", 0, { orientation: "vertical" })).toBeNull();
  });

  it("swaps the arrows in right-to-left text", () => {
    expect(move("ArrowLeft", 0, { direction: "rtl" })).toBe(1);
    expect(move("ArrowRight", 1, { direction: "rtl" })).toBe(0);
  });

  it("ignores keys it does not handle, and an out-of-range starting point", () => {
    expect(move("Enter", 0)).toBeNull();
    expect(move("ArrowRight", -1)).toBeNull();
    expect(nextIndex({ key: "ArrowRight", index: 0, count: 0 })).toBeNull();
  });
});
