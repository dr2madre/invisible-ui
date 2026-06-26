import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";

describe("switch state", () => {
  it("defaults to off and enabled", () => {
    expect(initialState()).toEqual({ checked: false, disabled: false });
  });
});

describe("switch connect (native input)", () => {
  const noop = () => {};

  it("exposes native checkbox + switch role props", () => {
    const api = connect({ state: { checked: true, disabled: false }, setChecked: noop });
    expect(api.rootProps.type).toBe("checkbox");
    expect(api.rootProps.role).toBe("switch");
    expect(api.rootProps["data-state"]).toBe("checked");
  });

  it("reflects the off state", () => {
    const api = connect({ state: { checked: false, disabled: false }, setChecked: noop });
    expect(api.rootProps["data-state"]).toBe("unchecked");
  });

  it("reports the new value from the input's change event", () => {
    const setChecked = vi.fn();
    const api = connect({ state: { checked: false, disabled: false }, setChecked });
    (api.rootProps.onChange as (e: Event) => void)({
      target: { checked: true },
    } as unknown as Event);
    expect(setChecked).toHaveBeenCalledWith(true);
  });

  it("toggles on activation", () => {
    const setChecked = vi.fn();
    const api = connect({ state: { checked: false, disabled: false }, setChecked });
    api.toggle();
    expect(setChecked).toHaveBeenCalledWith(true);
  });

  it("marks and ignores the disabled state", () => {
    const setChecked = vi.fn();
    const api = connect({ state: { checked: false, disabled: true }, setChecked });
    expect(api.rootProps.disabled).toBe(true);
    expect(api.rootProps["data-disabled"]).toBe("");
    api.toggle();
    api.setChecked(true);
    (api.rootProps.onChange as (e: Event) => void)({
      target: { checked: true },
    } as unknown as Event);
    expect(setChecked).not.toHaveBeenCalled();
  });
});
