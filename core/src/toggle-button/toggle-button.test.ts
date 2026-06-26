import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, togglePressed } from "./state";

describe("toggle button state", () => {
  it("defaults to not pressed and not disabled", () => {
    expect(initialState()).toEqual({ pressed: false, disabled: false });
  });

  it("flips the pressed value", () => {
    expect(togglePressed({ pressed: false, disabled: false }).pressed).toBe(true);
    expect(togglePressed({ pressed: true, disabled: false }).pressed).toBe(false);
  });

  it("does not change when disabled", () => {
    const state = { pressed: false, disabled: true };
    expect(togglePressed(state)).toBe(state);
  });
});

describe("toggle button connect", () => {
  const noop = () => {};

  it("exposes aria-pressed toggle-button props", () => {
    const api = connect({ state: { pressed: true, disabled: false }, setPressed: noop });
    expect(api.rootProps.type).toBe("button");
    expect(api.rootProps["aria-pressed"]).toBe(true);
    expect(api.rootProps["data-state"]).toBe("on");
  });

  it("reflects the off state", () => {
    const api = connect({ state: { pressed: false, disabled: false }, setPressed: noop });
    expect(api.rootProps["aria-pressed"]).toBe(false);
    expect(api.rootProps["data-state"]).toBe("off");
  });

  it("requests a pressed change on toggle", () => {
    const setPressed = vi.fn();
    const api = connect({ state: { pressed: false, disabled: false }, setPressed });
    api.toggle();
    expect(setPressed).toHaveBeenCalledWith(true);
  });

  it("ignores toggle and setPressed when disabled", () => {
    const setPressed = vi.fn();
    const api = connect({ state: { pressed: false, disabled: true }, setPressed });
    api.toggle();
    api.setPressed(true);
    expect(setPressed).not.toHaveBeenCalled();
  });
});
