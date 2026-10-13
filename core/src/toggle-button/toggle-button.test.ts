import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, setDisabled, togglePressed } from "./state";

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

  it("sets the disabled value and keeps the pressed one", () => {
    expect(setDisabled({ pressed: true, disabled: false }, true)).toEqual({
      pressed: true,
      disabled: true,
    });
    expect(setDisabled({ pressed: true, disabled: true }, false)).toEqual({
      pressed: true,
      disabled: false,
    });
  });

  it("returns the same state when the disabled value is unchanged", () => {
    const state = { pressed: false, disabled: true };
    expect(setDisabled(state, true)).toBe(state);
  });
});

describe("toggle button connect", () => {
  const noop = () => {};

  it("exposes native button props with aria-pressed", () => {
    const api = connect({ state: { pressed: true, disabled: false }, setPressed: noop });
    expect(api.rootProps.type).toBe("button");
    expect(api.rootProps["aria-pressed"]).toBe(true);
    expect(api.rootProps.role).toBeUndefined();
    expect(api.rootProps["data-state"]).toBe("on");
  });

  it("reflects the off state", () => {
    const api = connect({ state: { pressed: false, disabled: false }, setPressed: noop });
    expect(api.rootProps["aria-pressed"]).toBe(false);
    expect(api.rootProps["data-state"]).toBe("off");
  });

  it("flips the pressed value on click", () => {
    const setPressed = vi.fn();
    const api = connect({ state: { pressed: true, disabled: false }, setPressed });
    (api.rootProps.onClick as () => void)();
    expect(setPressed).toHaveBeenCalledWith(false);
  });

  it("submits the value under the name only while pressed and enabled", () => {
    const on = connect({ state: { pressed: true, disabled: false }, setPressed: noop });
    expect(on.getHiddenInputProps({ name: "bold" })).toEqual({
      type: "hidden",
      name: "bold",
      value: "on",
    });
    expect(on.getHiddenInputProps({ name: "bold", value: "1" })?.value).toBe("1");
    expect(on.getHiddenInputProps({})).toBeNull();
    const off = connect({ state: { pressed: false, disabled: false }, setPressed: noop });
    expect(off.getHiddenInputProps({ name: "bold" })).toBeNull();
    const disabled = connect({ state: { pressed: true, disabled: true }, setPressed: noop });
    expect(disabled.getHiddenInputProps({ name: "bold" })).toBeNull();
  });

  it("requests a pressed change on toggle", () => {
    const setPressed = vi.fn();
    const api = connect({ state: { pressed: false, disabled: false }, setPressed });
    api.toggle();
    expect(setPressed).toHaveBeenCalledWith(true);
  });

  it("ignores toggle, click and setPressed when disabled", () => {
    const setPressed = vi.fn();
    const api = connect({ state: { pressed: false, disabled: true }, setPressed });
    api.toggle();
    api.setPressed(true);
    (api.rootProps.onClick as () => void)();
    expect(setPressed).not.toHaveBeenCalled();
    expect(api.rootProps.disabled).toBe(true);
  });
});
