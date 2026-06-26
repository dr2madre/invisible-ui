import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, toggleValue } from "./state";
import type { CheckboxGroupItem } from "./types";

const items: CheckboxGroupItem[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS", disabled: true },
  { value: "push", label: "Push" },
];

describe("checkbox group state", () => {
  it("defaults to an empty selection", () => {
    expect(initialState({ items }).value).toEqual([]);
  });

  it("toggleValue adds and removes", () => {
    expect(toggleValue([], "a")).toEqual(["a"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("checkbox group connect (native inputs)", () => {
  const noop = () => {};

  it("exposes native checkbox item props with a shared name", () => {
    const api = connect({ state: initialState({ items }), setValue: noop, name: "notifications" });
    const email = api.getItemProps("email");
    expect(email.type).toBe("checkbox");
    expect(email.name).toBe("notifications");
    expect(email.value).toBe("email");
  });

  it("marks checked items and supports multiple selection", () => {
    const api = connect({
      state: initialState({ items, value: ["email", "push"] }),
      setValue: noop,
    });
    expect(api.getItemProps("email")["data-state"]).toBe("checked");
    expect(api.getItemProps("push")["data-state"]).toBe("checked");
    expect(api.isChecked("email")).toBe(true);
  });

  it("toggles a value on change, adding then removing", () => {
    const setValue = vi.fn();
    let api = connect({ state: initialState({ items, value: [] }), setValue });
    (api.getItemProps("email").onChange as () => void)();
    expect(setValue).toHaveBeenCalledWith(["email"]);

    setValue.mockClear();
    api = connect({ state: initialState({ items, value: ["email"] }), setValue });
    (api.getItemProps("email").onChange as () => void)();
    expect(setValue).toHaveBeenCalledWith([]);
  });

  it("refuses disabled items and a disabled group", () => {
    const setValue = vi.fn();
    const api = connect({ state: initialState({ items }), setValue });
    expect(api.getItemProps("sms").disabled).toBe(true);
    api.toggle("sms"); // item disabled
    expect(setValue).not.toHaveBeenCalled();

    const groupOff = connect({ state: initialState({ items, disabled: true }), setValue });
    expect(groupOff.rootProps.disabled).toBe(true);
    expect(groupOff.rootProps["data-disabled"]).toBe("");
    expect(groupOff.getItemProps("email").disabled).toBe(true);
    groupOff.toggle("email");
    expect(setValue).not.toHaveBeenCalled();
  });
});
