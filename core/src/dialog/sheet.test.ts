import { describe, expect, it } from "vitest";
import { sheetEdge, sheetOutward, sheetShouldDismiss } from "./sheet";

describe("sheetEdge", () => {
  it("resolves the physical names to the logical edges and defaults to the end", () => {
    expect(sheetEdge(undefined)).toBe("end");
    expect(sheetEdge("right")).toBe("end");
    expect(sheetEdge("left")).toBe("start");
    expect(sheetEdge("start")).toBe("start");
    expect(sheetEdge("end")).toBe("end");
    expect(sheetEdge("top")).toBe("top");
    expect(sheetEdge("bottom")).toBe("bottom");
  });
});

describe("sheetOutward", () => {
  it("measures the inline edges along the reading direction", () => {
    expect(sheetOutward("end", "ltr", 40, 0)).toBe(40);
    expect(sheetOutward("end", "rtl", -40, 0)).toBe(40);
    expect(sheetOutward("end", "rtl", 40, 0)).toBe(-40);
    expect(sheetOutward("start", "ltr", -40, 0)).toBe(40);
    expect(sheetOutward("start", "rtl", 40, 0)).toBe(40);
  });

  it("measures the block edges the same way in both directions", () => {
    for (const direction of ["ltr", "rtl"] as const) {
      expect(sheetOutward("bottom", direction, 0, 30)).toBe(30);
      expect(sheetOutward("top", direction, 0, -30)).toBe(30);
    }
  });
});

describe("sheetShouldDismiss", () => {
  it("dismisses past a quarter of the extent or a quick flick", () => {
    expect(sheetShouldDismiss(60, 200, 0)).toBe(true);
    expect(sheetShouldDismiss(40, 200, 0)).toBe(false);
    expect(sheetShouldDismiss(5, 200, 0.6)).toBe(true);
    expect(sheetShouldDismiss(60, 0, 0)).toBe(false);
  });
});
