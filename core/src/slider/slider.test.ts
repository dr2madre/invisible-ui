import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, percentage, snap, valueFromFraction } from "./state";

const make = (overrides = {}) => initialState({ id: "x", ...overrides });

describe("slider state", () => {
  it("defaults to min over 0–100 step 1", () => {
    const s = initialState();
    expect(s.value).toBe(0);
    expect(s.max).toBe(100);
    expect(s.step).toBe(1);
  });

  it("snaps and clamps the initial value", () => {
    expect(make({ value: 7, step: 5 }).value).toBe(5);
    expect(make({ value: 999 }).value).toBe(100);
    expect(make({ value: -5 }).value).toBe(0);
  });

  it("computes percentage", () => {
    expect(percentage(make({ value: 25 }))).toBe(25);
    expect(percentage(make({ value: 4, min: 0, max: 8 }))).toBe(50);
  });

  it("maps a track fraction to a snapped value", () => {
    expect(valueFromFraction(make({ step: 10 }), 0.44)).toBe(40);
    expect(valueFromFraction(make(), 1)).toBe(100);
  });

  it("snaps cleanly for fractional steps", () => {
    expect(snap(0.27, 0, 1, 0.1)).toBe(0.3);
  });
});

describe("slider connect (native range input)", () => {
  it("exposes native range props with bounds and the filled percentage", () => {
    const api = connect({ state: make({ value: 30 }), setValue: () => {} });
    expect(api.inputProps.type).toBe("range");
    expect(api.inputProps.min).toBe(0);
    expect(api.inputProps.max).toBe(100);
    expect(api.inputProps.step).toBe(1);
    expect(api.value).toBe(30);
    expect(api.percentage).toBe(30);
  });

  it("sets a snapped value from the input event", () => {
    const setValue = vi.fn();
    const api = connect({ state: make({ step: 25 }), setValue });
    (api.inputProps.onInput as (e: Event) => void)({
      target: { value: "60" },
    } as unknown as Event);
    expect(setValue).toHaveBeenCalledWith(50); // snapped to the nearest 25
  });

  it("ignores changes when disabled", () => {
    const setValue = vi.fn();
    const api = connect({ state: make({ disabled: true, value: 50 }), setValue });
    api.setValue(80);
    (api.inputProps.onInput as (e: Event) => void)({
      target: { value: "10" },
    } as unknown as Event);
    expect(setValue).not.toHaveBeenCalled();
    expect(api.inputProps.disabled).toBe(true);
  });
});
