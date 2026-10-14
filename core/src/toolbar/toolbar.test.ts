import { describe, expect, it } from "vitest";
import { controlKind, nextIndex } from "./state";

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

describe("toolbar keys a control needs for itself", () => {
  const input = (type = "text", readOnly = false) =>
    controlKind({ tagName: "INPUT", type, readOnly });

  it("tells what a control is", () => {
    expect(input("text")).toBe("text");
    expect(input("email")).toBe("text");
    expect(input("date")).toBe("text");
    expect(input("checkbox")).toBe("other");
    expect(input("button")).toBe("other");
    expect(input("text", true)).toBe("other");
    expect(controlKind({ tagName: "TEXTAREA" })).toBe("multiline");
    expect(controlKind({ tagName: "DIV", isContentEditable: true })).toBe("multiline");
    expect(controlKind({ tagName: "BUTTON" })).toBe("other");
    expect(controlKind(null)).toBe("other");
  });

  it("leaves the caret keys to a text input in a horizontal toolbar", () => {
    for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
      expect(move(key, 1, { control: "text" })).toBeNull();
    }
    // Up and Down move no caret in one line, and mean nothing to the toolbar.
    expect(move("ArrowDown", 1, { control: "text" })).toBeNull();
  });

  it("leaves the vertical arrows to a text input in a vertical toolbar, but not the horizontal ones", () => {
    const vertical = { orientation: "vertical", control: "text" };
    expect(move("ArrowDown", 0, vertical)).toBeNull();
    expect(move("ArrowUp", 1, vertical)).toBeNull();
    expect(move("Home", 1, vertical)).toBeNull();
  });

  it("leaves every arrow and Home and End to editable multi-line content", () => {
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]) {
      expect(move(key, 1, { control: "multiline" })).toBeNull();
      expect(move(key, 1, { control: "multiline", orientation: "vertical" })).toBeNull();
    }
  });

  it("keeps moving focus from any other control", () => {
    expect(move("ArrowRight", 0, { control: "other" })).toBe(1);
    expect(move("Home", 2, { control: "other" })).toBe(0);
  });
});
