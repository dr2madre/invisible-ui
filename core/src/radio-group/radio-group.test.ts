import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";
import type { RadioItem } from "./types";

const items: RadioItem[] = [{ value: "a" }, { value: "b", disabled: true }, { value: "c" }];

describe("radio group state", () => {
  it("defaults value to null and orientation to vertical", () => {
    const state = initialState({ items });
    expect(state.value).toBeNull();
    expect(state.orientation).toBe("vertical");
  });
});

describe("radio group connect (native inputs)", () => {
  const noop = () => {};

  it("exposes radiogroup props with orientation", () => {
    const api = connect({
      state: initialState({ items, orientation: "horizontal" }),
      setValue: noop,
    });
    expect(api.rootProps.role).toBe("radiogroup");
    expect(api.rootProps["aria-orientation"]).toBe("horizontal");
  });

  it("exposes native radio item props with a shared name", () => {
    const api = connect({ state: initialState({ items }), setValue: noop, name: "size" });
    const a = api.getItemProps("a");
    expect(a.type).toBe("radio");
    expect(a.name).toBe("size");
    expect(a.value).toBe("a");
  });

  it("marks the selected item as checked", () => {
    const api = connect({ state: initialState({ items, value: "a" }), setValue: noop });
    expect(api.getItemProps("a")["data-state"]).toBe("checked");
    expect(api.getItemProps("c")["data-state"]).toBe("unchecked");
  });

  it("selects on change but not for disabled items", () => {
    const setValue = vi.fn();
    const api = connect({ state: initialState({ items }), setValue });
    (api.getItemProps("a").onChange as () => void)();
    expect(setValue).toHaveBeenCalledWith("a");

    setValue.mockClear();
    (api.getItemProps("b").onChange as () => void)(); // disabled
    expect(setValue).not.toHaveBeenCalled();
  });

  it("disables the whole group", () => {
    const setValue = vi.fn();
    const api = connect({ state: initialState({ items, disabled: true }), setValue });
    expect(api.rootProps["data-disabled"]).toBe("");
    expect(api.getItemProps("a").disabled).toBe(true);
    (api.getItemProps("a").onChange as () => void)();
    expect(setValue).not.toHaveBeenCalled();
  });
});
