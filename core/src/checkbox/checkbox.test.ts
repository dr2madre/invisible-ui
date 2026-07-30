import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, nextChecked } from "./state";

describe("checkbox state", () => {
  it("defaults to unchecked and enabled", () => {
    expect(initialState()).toEqual({ checked: false, disabled: false });
  });

  it("advances unchecked and indeterminate to checked", () => {
    expect(nextChecked(false)).toBe(true);
    expect(nextChecked("indeterminate")).toBe(true);
  });

  it("advances checked to unchecked", () => {
    expect(nextChecked(true)).toBe(false);
  });
});

describe("checkbox connect (native input)", () => {
  const noop = () => {};

  it("exposes native checkbox props when unchecked", () => {
    const api = connect({ state: { checked: false, disabled: false }, setChecked: noop });
    expect(api.rootProps.type).toBe("checkbox");
    expect(api.rootProps["data-state"]).toBe("unchecked");
    expect(api.indeterminate).toBe(false);
  });

  it("reflects the checked state", () => {
    const api = connect({ state: { checked: true, disabled: false }, setChecked: noop });
    expect(api.checked).toBe(true);
    expect(api.rootProps["data-state"]).toBe("checked");
  });

  it("reflects the indeterminate state", () => {
    const api = connect({
      state: { checked: "indeterminate", disabled: false },
      setChecked: noop,
    });
    expect(api.indeterminate).toBe(true);
    expect(api.rootProps["data-state"]).toBe("indeterminate");
  });

  // `indeterminate` has no HTML attribute, so it can only reach the element as
  // a DOM property. Declaring it here is what lets every adapter apply it
  // generically instead of each remembering to do it by hand.
  it("declares indeterminate as a DOM property, not an attribute", () => {
    const on = connect({ state: { checked: "indeterminate", disabled: false }, setChecked: noop });
    expect(on.rootDomProps).toEqual({ indeterminate: true });
    expect(on.rootProps).not.toHaveProperty("indeterminate");

    const off = connect({ state: { checked: true, disabled: false }, setChecked: noop });
    expect(off.rootDomProps).toEqual({ indeterminate: false });
  });

  it("reports the new value from the input's change event", () => {
    const setChecked = vi.fn();
    const api = connect({ state: { checked: false, disabled: false }, setChecked });
    const onChange = api.rootProps.onChange as (e: Event) => void;
    onChange({ target: { checked: true, indeterminate: false } } as unknown as Event);
    expect(setChecked).toHaveBeenCalledWith(true);
  });

  it("toggles and reports the next value", () => {
    const setChecked = vi.fn();
    const api = connect({
      state: { checked: "indeterminate", disabled: false },
      setChecked,
    });
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
      target: { checked: true, indeterminate: false },
    } as unknown as Event);
    expect(setChecked).not.toHaveBeenCalled();
  });
});
