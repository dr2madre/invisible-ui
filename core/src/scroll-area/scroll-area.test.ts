import { describe, expect, it } from "vitest";
import {
  hasOverflow,
  scrollByThumbDrag,
  scrollbar,
  thumbOffsetFraction,
  thumbSizeFraction,
} from "./geometry";

describe("scroll-area geometry", () => {
  it("detects overflow (with a sub-pixel tolerance)", () => {
    expect(hasOverflow({ scrollPos: 0, scrollSize: 200, clientSize: 100 })).toBe(true);
    expect(hasOverflow({ scrollPos: 0, scrollSize: 100, clientSize: 100 })).toBe(false);
    expect(hasOverflow({ scrollPos: 0, scrollSize: 100.5, clientSize: 100 })).toBe(false);
  });

  it("sizes the thumb to the visible fraction", () => {
    expect(thumbSizeFraction({ scrollPos: 0, scrollSize: 400, clientSize: 100 })).toBe(0.25);
    // No overflow → full-length thumb.
    expect(thumbSizeFraction({ scrollPos: 0, scrollSize: 100, clientSize: 100 })).toBe(1);
  });

  it("offsets the thumb across the remaining track as you scroll", () => {
    const m = { scrollSize: 400, clientSize: 100 }; // size fraction 0.25, travel 0.75
    expect(thumbOffsetFraction({ ...m, scrollPos: 0 })).toBe(0);
    // Half-scrolled (150 of 300 max) → halfway along the 0.75 travel.
    expect(thumbOffsetFraction({ ...m, scrollPos: 150 })).toBeCloseTo(0.375, 5);
    // Fully scrolled → thumb ends flush with the track end.
    expect(thumbOffsetFraction({ ...m, scrollPos: 300 })).toBeCloseTo(0.75, 5);
  });

  it("combines into scrollbar geometry", () => {
    expect(scrollbar({ scrollPos: 0, scrollSize: 100, clientSize: 100 })).toEqual({
      overflow: false,
      sizeFraction: 1,
      offsetFraction: 0,
    });
  });

  it("maps a thumb drag to a (faster, clamped) scroll position", () => {
    const m = { scrollPos: 0, scrollSize: 400, clientSize: 100 };
    // Dragging 10px moves the viewport 10 * 400/100 = 40px.
    expect(scrollByThumbDrag(10, m)).toBe(40);
    // Clamped to the top…
    expect(scrollByThumbDrag(-50, m)).toBe(0);
    // …and to the bottom (max scroll = 300).
    expect(scrollByThumbDrag(1000, m)).toBe(300);
  });
});
