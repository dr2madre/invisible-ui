import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { initialState, level, percentage } from "./state";

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
