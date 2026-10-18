import { describe, expect, it } from "vitest";
import { edge, outward, shouldDismiss } from ".";

describe("edge", () => {
  it("defaults to the end", () => {
    expect(edge(undefined)).toBe("end");
    expect(edge("start")).toBe("start");
    expect(edge("end")).toBe("end");
    expect(edge("top")).toBe("top");
    expect(edge("bottom")).toBe("bottom");
  });
});

describe("outward", () => {
  it("measures the inline edges along the reading direction", () => {
    expect(outward("end", "ltr", 40, 0)).toBe(40);
    expect(outward("end", "rtl", -40, 0)).toBe(40);
    expect(outward("end", "rtl", 40, 0)).toBe(-40);
    expect(outward("start", "ltr", -40, 0)).toBe(40);
    expect(outward("start", "rtl", 40, 0)).toBe(40);
  });

  it("measures the block edges the same way in both directions", () => {
    for (const direction of ["ltr", "rtl"] as const) {
      expect(outward("bottom", direction, 0, 30)).toBe(30);
      expect(outward("top", direction, 0, -30)).toBe(30);
    }
  });
});

describe("shouldDismiss", () => {
  it("dismisses past a quarter of the extent or a quick flick", () => {
    expect(shouldDismiss(60, 200, 0)).toBe(true);
    expect(shouldDismiss(40, 200, 0)).toBe(false);
    expect(shouldDismiss(5, 200, 0.6)).toBe(true);
    expect(shouldDismiss(60, 0, 0)).toBe(false);
  });
});
