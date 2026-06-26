import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { dataState, initialState, isIndeterminate, percentage } from "./state";

const make = (overrides = {}) => initialState({ id: "x", ...overrides });

describe("progress state", () => {
  it("defaults to determinate 0 over 0–100", () => {
    const s = initialState();
    expect(s.value).toBe(0);
    expect(s.min).toBe(0);
    expect(s.max).toBe(100);
    expect(isIndeterminate(s)).toBe(false);
  });

  it("treats an explicit null value as indeterminate", () => {
    const s = make({ value: null });
    expect(isIndeterminate(s)).toBe(true);
    expect(percentage(s)).toBeNull();
    expect(dataState(s)).toBe("indeterminate");
  });

  it("computes percentage within a custom range and clamps overflow", () => {
    expect(percentage(make({ value: 5, min: 0, max: 10 }))).toBe(50);
    expect(percentage(make({ value: 20, min: 0, max: 10 }))).toBe(100);
    expect(percentage(make({ value: -5, min: 0, max: 10 }))).toBe(0);
  });

  it("reports completion via dataState", () => {
    expect(dataState(make({ value: 50 }))).toBe("loading");
    expect(dataState(make({ value: 100 }))).toBe("complete");
  });
});

describe("progress connect", () => {
  it("exposes the progressbar role and ARIA value for a determinate bar", () => {
    const api = connect({ state: make({ value: 30 }) });
    expect(api.rootProps.role).toBe("progressbar");
    expect(api.rootProps["aria-valuemin"]).toBe(0);
    expect(api.rootProps["aria-valuemax"]).toBe(100);
    expect(api.rootProps["aria-valuenow"]).toBe(30);
    expect(api.percentage).toBe(30);
    expect(api.indeterminate).toBe(false);
  });

  it("omits aria-valuenow when indeterminate", () => {
    const api = connect({ state: make({ value: null }) });
    expect(api.rootProps["aria-valuenow"]).toBeUndefined();
    expect(api.rootProps["data-state"]).toBe("indeterminate");
    expect(api.indeterminate).toBe(true);
  });

  it("clamps aria-valuenow into range", () => {
    expect(connect({ state: make({ value: 150 }) }).rootProps["aria-valuenow"]).toBe(100);
  });
});
