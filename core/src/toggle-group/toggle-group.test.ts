import { describe, expect, it } from "vitest";
import { move, refocusIndex, roves, tabStop } from "./index";

describe("toggle group roving rule", () => {
  it("is one tab stop from three toggles, outside a toolbar", () => {
    expect(roves({ count: 1, inToolbar: false })).toBe(false);
    expect(roves({ count: 2, inToolbar: false })).toBe(false);
    expect(roves({ count: 3, inToolbar: false })).toBe(true);
    expect(roves({ count: 5, inToolbar: true })).toBe(false);
  });

  it("puts the tab stop on the focused, then the last focused, then the first enabled toggle", () => {
    const disabled = [true, false, false, false];
    expect(tabStop({ disabled, focused: 2, last: 3 })).toBe(2);
    expect(tabStop({ disabled, last: 3 })).toBe(3);
    expect(tabStop({ disabled })).toBe(1);
    expect(tabStop({ disabled: [false, true, false], last: 1 })).toBe(0);
    expect(tabStop({ disabled: [true, true] })).toBe(-1);
  });

  it("moves between enabled toggles, wrapping, with Home and End", () => {
    const disabled = [false, true, false, false];
    expect(move({ key: "ArrowRight", index: 0, disabled })).toBe(2);
    expect(move({ key: "ArrowRight", index: 3, disabled })).toBe(0);
    expect(move({ key: "ArrowLeft", index: 0, disabled })).toBe(3);
    expect(move({ key: "Home", index: 3, disabled })).toBe(0);
    expect(move({ key: "End", index: 0, disabled })).toBe(3);
    expect(move({ key: "ArrowDown", index: 0, disabled })).toBeNull();
    expect(move({ key: "a", index: 0, disabled })).toBeNull();
  });

  it("mirrors the horizontal arrows in right-to-left text", () => {
    const disabled = [false, false, false];
    expect(move({ key: "ArrowLeft", index: 0, disabled, direction: "rtl" })).toBe(1);
    expect(move({ key: "ArrowRight", index: 0, disabled, direction: "rtl" })).toBe(2);
  });

  it("uses up and down in a vertical group", () => {
    const disabled = [false, false, false];
    expect(move({ key: "ArrowDown", index: 0, disabled, orientation: "vertical" })).toBe(1);
    expect(move({ key: "ArrowUp", index: 0, disabled, orientation: "vertical" })).toBe(2);
    expect(move({ key: "ArrowRight", index: 0, disabled, orientation: "vertical" })).toBeNull();
  });

  it("refocuses the toggle at the removed one's place, or the last", () => {
    expect(refocusIndex({ lastIndex: 1, count: 3 })).toBe(1);
    expect(refocusIndex({ lastIndex: 3, count: 3 })).toBe(2);
    expect(refocusIndex({ lastIndex: 0, count: 0 })).toBe(-1);
  });
});
