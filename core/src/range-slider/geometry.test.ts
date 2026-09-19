import { describe, expect, it } from "vitest";
import { nearerThumb, pointerFraction, restingThumb, valueFraction } from "./geometry";

const box = { left: 100, top: 50, width: 200, height: 300 };

describe("pointerFraction: the logical axis, whatever the physical one", () => {
  it("horizontal LTR runs left to right", () => {
    const axis = { orientation: "horizontal", rtl: false } as const;
    expect(pointerFraction(axis, box, 100, 0)).toBe(0);
    expect(pointerFraction(axis, box, 150, 0)).toBe(0.25);
    expect(pointerFraction(axis, box, 300, 0)).toBe(1);
  });

  it("horizontal RTL runs right to left: min is on the right", () => {
    const axis = { orientation: "horizontal", rtl: true } as const;
    expect(pointerFraction(axis, box, 300, 0)).toBe(0);
    expect(pointerFraction(axis, box, 250, 0)).toBe(0.25);
    expect(pointerFraction(axis, box, 100, 0)).toBe(1);
  });

  it("vertical with the library's rtl writing runs bottom to top: min is at the bottom", () => {
    const axis = { orientation: "vertical", rtl: true } as const;
    expect(pointerFraction(axis, box, 0, 350)).toBe(0);
    expect(pointerFraction(axis, box, 0, 275)).toBe(0.25);
    expect(pointerFraction(axis, box, 0, 50)).toBe(1);
  });

  it("vertical without rtl runs top to bottom", () => {
    const axis = { orientation: "vertical", rtl: false } as const;
    expect(pointerFraction(axis, box, 0, 50)).toBe(0);
    expect(pointerFraction(axis, box, 0, 350)).toBe(1);
  });

  it("clamps a pointer past either end, and survives an empty box", () => {
    const axis = { orientation: "horizontal", rtl: false } as const;
    expect(pointerFraction(axis, box, -999, 0)).toBe(0);
    expect(pointerFraction(axis, box, 999, 0)).toBe(1);
    expect(pointerFraction(axis, { ...box, width: 0 }, 150, 0)).toBe(0);
    expect(
      pointerFraction({ ...axis, orientation: "vertical" }, { ...box, height: 0 }, 0, 75),
    ).toBe(0);
  });
});

describe("valueFraction", () => {
  it("maps a value onto the track and never leaves it", () => {
    expect(valueFraction(0, 0, 100)).toBe(0);
    expect(valueFraction(25, 0, 100)).toBe(0.25);
    expect(valueFraction(100, 0, 100)).toBe(1);
    expect(valueFraction(150, 0, 100)).toBe(1);
    expect(valueFraction(-5, 0, 100)).toBe(0);
    expect(valueFraction(5, 5, 5), "an empty span").toBe(0);
  });
});

describe("nearerThumb", () => {
  it("picks the nearer of two thumbs apart, the lower one at the exact midpoint", () => {
    expect(nearerThumb(0.1, 0.2, 0.8)).toBe(0);
    expect(nearerThumb(0.7, 0.2, 0.8)).toBe(1);
    expect(nearerThumb(0.5, 0.2, 0.8)).toBe(0);
  });

  it("stacked thumbs: the side of the stack the pointer is on decides", () => {
    expect(nearerThumb(0.6, 0.5, 0.5), "right of the stack, about to drag up").toBe(1);
    expect(nearerThumb(0.4, 0.5, 0.5), "left of the stack, about to drag down").toBe(0);
  });

  it("a pointer dead on the stack reaches the thumb that can still move", () => {
    expect(nearerThumb(0.5, 0.5, 0.5), "mid-track: the upper one").toBe(1);
    expect(nearerThumb(1, 1, 1), "at max only the lower one can move").toBe(0);
    expect(nearerThumb(0, 0, 0), "at min only the upper one can move").toBe(1);
  });
});

describe("restingThumb: what a touch with no hover before it lands on", () => {
  it("keeps the upper thumb on top unless the pair is stacked at max", () => {
    expect(restingThumb(0.2, 0.8)).toBe(1);
    expect(restingThumb(0.5, 0.5)).toBe(1);
    expect(restingThumb(0, 0)).toBe(1);
    expect(restingThumb(1, 1)).toBe(0);
  });
});
