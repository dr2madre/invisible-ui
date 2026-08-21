import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { initialState, level, percentage, quality } from "./state";

const make = (overrides = {}) => initialState({ id: "x", ...overrides });

describe("meter state", () => {
  it("defaults to 0 over 0–100 with no thresholds", () => {
    const s = initialState();
    expect(s.value).toBe(0);
    expect(s.max).toBe(100);
    expect(s.low).toBeNull();
    expect(s.high).toBeNull();
  });

  it("computes percentage within a custom range and clamps", () => {
    expect(percentage(make({ value: 3, min: 0, max: 6 }))).toBe(50);
    expect(percentage(make({ value: 99, min: 0, max: 6 }))).toBe(100);
  });

  it("bands the value by the low/high thresholds", () => {
    expect(level(make({ value: 10, low: 20, high: 80 }))).toBe("low");
    expect(level(make({ value: 50, low: 20, high: 80 }))).toBe("medium");
    expect(level(make({ value: 90, low: 20, high: 80 }))).toBe("high");
  });

  it("is medium when thresholds are unset", () => {
    expect(level(make({ value: 50 }))).toBe("medium");
  });
});

describe("meter connect", () => {
  it("exposes the meter role and ARIA value", () => {
    const api = connect({ state: make({ value: 40, low: 20, high: 80 }) });
    expect(api.rootProps.role).toBe("meter");
    expect(api.rootProps["aria-valuenow"]).toBe(40);
    expect(api.rootProps["aria-valuemin"]).toBe(0);
    expect(api.rootProps["aria-valuemax"]).toBe(100);
    expect(api.rootProps["data-level"]).toBe("medium");
    expect(api.percentage).toBe(40);
  });

  it("clamps aria-valuenow into range", () => {
    expect(connect({ state: make({ value: -10 }) }).rootProps["aria-valuenow"]).toBe(0);
  });
});

describe("meter quality", () => {
  const disk = (value: number) =>
    // Disk usage: the good end is empty, so low is good and high is bad.
    initialState({ value, min: 0, max: 100, low: 50, high: 80, optimum: 0 });
  const battery = (value: number) =>
    // Battery: the good end is full, which is also the default.
    initialState({ value, min: 0, max: 100, low: 20, high: 60 });

  it("defaults the good end to the top of the scale", () => {
    expect(initialState({ max: 40 }).optimum).toBe(40);
  });

  it("reads a rising measure as improving", () => {
    expect(quality(battery(90))).toBe("optimal");
    expect(quality(battery(40))).toBe("suboptimal");
    expect(quality(battery(10))).toBe("poor");
  });

  it("reads a falling measure the other way round", () => {
    expect(quality(disk(10))).toBe("optimal");
    expect(quality(disk(60))).toBe("suboptimal");
    expect(quality(disk(90))).toBe("poor");
  });

  it("keeps the band separate from the judgement", () => {
    // The same band, opposite meanings: that is the whole point.
    expect(level(disk(90))).toBe("high");
    expect(level(battery(90))).toBe("high");
    expect(quality(disk(90))).toBe("poor");
    expect(quality(battery(90))).toBe("optimal");
  });

  it("treats both extremes as middling when the good end is in the middle", () => {
    const bloodPressure = (value: number) =>
      initialState({ value, min: 0, max: 200, low: 90, high: 140, optimum: 115 });
    expect(quality(bloodPressure(115))).toBe("optimal");
    expect(quality(bloodPressure(60))).toBe("suboptimal");
    expect(quality(bloodPressure(180))).toBe("suboptimal");
  });
});
