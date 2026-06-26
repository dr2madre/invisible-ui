import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { canGoTo, clampStep, initialState, stepStatus } from "./state";

const make = (overrides = {}) => initialState({ id: "x", count: 4, ...overrides });

describe("stepper state", () => {
  it("defaults to step 0, linear, horizontal", () => {
    const s = make();
    expect(s.current).toBe(0);
    expect(s.linear).toBe(true);
    expect(s.orientation).toBe("horizontal");
  });

  it("clamps the initial step into range", () => {
    expect(make({ current: 9 }).current).toBe(3);
    expect(make({ current: -2 }).current).toBe(0);
    expect(clampStep(5, 0)).toBe(0);
  });

  it("classifies steps relative to current", () => {
    const s = make({ current: 2 });
    expect(stepStatus(s, 0)).toBe("complete");
    expect(stepStatus(s, 2)).toBe("current");
    expect(stepStatus(s, 3)).toBe("upcoming");
  });

  it("linear: only current and completed steps are reachable", () => {
    const s = make({ current: 2 });
    expect(canGoTo(s, 0)).toBe(true);
    expect(canGoTo(s, 2)).toBe(true);
    expect(canGoTo(s, 3)).toBe(false); // upcoming
  });

  it("non-linear: any in-range step is reachable", () => {
    const s = make({ current: 0, linear: false });
    expect(canGoTo(s, 3)).toBe(true);
    expect(canGoTo(s, 4)).toBe(false); // out of range
  });

  it("disabled: nothing is reachable", () => {
    expect(canGoTo(make({ current: 2, disabled: true }), 0)).toBe(false);
  });
});

describe("stepper connect", () => {
  const wire = (overrides = {}) => {
    const setStep = vi.fn();
    return { api: connect({ state: make(overrides), setStep }), setStep };
  };

  it("marks the current step with aria-current and exposes status", () => {
    const { api } = wire({ current: 1 });
    expect(api.rootProps["data-orientation"]).toBe("horizontal");
    expect(api.getStepProps(1)["aria-current"]).toBe("step");
    expect(api.getStepProps(0)["aria-current"]).toBeUndefined();
    expect(api.getStepProps(0)["data-status"]).toBe("complete");
    expect(api.getStepProps(2)["data-status"]).toBe("upcoming");
  });

  it("disables unreachable step triggers in linear mode", () => {
    const { api } = wire({ current: 1 });
    expect(api.getStepProps(0).disabled).toBeUndefined(); // completed → reachable
    expect(api.getStepProps(3).disabled).toBe(true); // upcoming → blocked
  });

  it("next/prev advance and clamp at the ends", () => {
    const start = wire({ current: 0 });
    start.api.next();
    expect(start.setStep).toHaveBeenCalledWith(1);

    const atStart = wire({ current: 0 });
    atStart.api.prev();
    expect(atStart.setStep).not.toHaveBeenCalled(); // clamped at 0

    const atEnd = wire({ current: 3 });
    atEnd.api.next();
    expect(atEnd.setStep).not.toHaveBeenCalled(); // clamped at last
  });

  it("goTo respects reachability", () => {
    const blocked = wire({ current: 1 });
    blocked.api.goTo(3);
    expect(blocked.setStep).not.toHaveBeenCalled(); // upcoming in linear mode

    const allowed = wire({ current: 3 });
    allowed.api.goTo(0);
    expect(allowed.setStep).toHaveBeenCalledWith(0);
  });

  it("step click goes to that step", () => {
    const { api, setStep } = wire({ current: 2 });
    (api.getStepProps(0).onClick as () => void)();
    expect(setStep).toHaveBeenCalledWith(0);
  });
});
