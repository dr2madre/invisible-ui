import { describe, expect, it, vi } from "vitest";
import { connect, type ConnectOptions } from "./connect";
import { addValue, initialState, lastRemovableValue, removeValue, resolveItem } from "./state";
import type { MultiSelectItem, MultiSelectState } from "./types";

const items: MultiSelectItem[] = [
  { value: "ada", label: "Ada" },
  { value: "grace", label: "Grace" },
  { value: "alan", label: "Alan", disabled: true },
  { value: "edsger", label: "Edsger" },
];

const make = (overrides: Partial<MultiSelectState> = {}): MultiSelectState => ({
  ...initialState({ items, id: "ms" }),
  ...overrides,
});

const setup = (overrides: Partial<MultiSelectState> = {}) => {
  const setValues = vi.fn();
  const setOpen = vi.fn();
  const setActiveValue = vi.fn();
  const setInputValue = vi.fn();
  const options: ConnectOptions = {
    state: make(overrides),
    setValues,
    setOpen,
    setActiveValue,
    setInputValue,
  };
  return { api: connect(options), setValues, setOpen, setActiveValue, setInputValue };
};

const keydown = (key: string) => {
  const preventDefault = vi.fn();
  return { event: { key, preventDefault } as unknown as Event, preventDefault };
};

describe("multi select state — pure transitions", () => {
  it("adds in selection order and no-ops on duplicates with the same reference", () => {
    const empty: string[] = [];
    const one = addValue(empty, "ada", null);
    expect(one).toEqual(["ada"]);
    expect(addValue(one, "ada", null)).toBe(one);
    expect(addValue(one, "grace", null)).toEqual(["ada", "grace"]);
  });

  it("max blocks additions but never removes existing values", () => {
    const two = ["ada", "grace"];
    expect(addValue(two, "edsger", 2)).toBe(two);
    // Hostile input already over the cap stays intact.
    const three = ["ada", "grace", "edsger"];
    expect(addValue(three, "x", 2)).toBe(three);
    expect(removeValue(three, "grace")).toEqual(["ada", "edsger"]);
  });

  it("removes every occurrence and no-ops on absent values", () => {
    const hostile = ["ada", "grace", "ada"];
    expect(removeValue(hostile, "ada")).toEqual(["grace"]);
    const clean = ["grace"];
    expect(removeValue(clean, "missing")).toBe(clean);
  });

  it("resolves a disappeared value to a raw, safe fallback", () => {
    expect(resolveItem(items, "ghost")).toEqual({ value: "ghost", label: "ghost" });
    expect(resolveItem(items, "ada")).toEqual({ value: "ada", label: "Ada" });
  });

  it("finds the last removable value, skipping disabled items", () => {
    expect(lastRemovableValue(["ada", "grace", "alan"], items)).toBe("grace");
    expect(lastRemovableValue(["alan"], items)).toBeNull();
    expect(lastRemovableValue([], items)).toBeNull();
  });
});

describe("multi select connect — selection", () => {
  it("select adds, keeps the popup open and clears the filter text", () => {
    const { api, setValues, setOpen, setInputValue } = setup({
      open: true,
      values: ["ada"],
      inputValue: "gr",
    });
    api.select("grace");
    expect(setValues).toHaveBeenCalledWith(["ada", "grace"]);
    expect(setOpen).not.toHaveBeenCalled();
    expect(setInputValue).toHaveBeenCalledWith("");
  });

  it("reselecting a selected value is a silent no-op", () => {
    const { api, setValues, setInputValue } = setup({ open: true, values: ["ada"] });
    api.select("ada");
    expect(setValues).not.toHaveBeenCalled();
    expect(setInputValue).not.toHaveBeenCalled();
  });

  it("never selects disabled options or past max", () => {
    const { api, setValues } = setup({ open: true, values: ["ada"], max: 1 });
    api.select("alan");
    api.select("grace");
    expect(setValues).not.toHaveBeenCalled();
    expect(api.canAdd("grace")).toBe(false);
  });

  it("remove drops the value; removeLast skips disabled selections", () => {
    const { api, setValues } = setup({ values: ["ada", "grace", "alan"] });
    api.remove("grace");
    expect(setValues).toHaveBeenCalledWith(["ada", "alan"]);
    api.removeLast();
    expect(setValues).toHaveBeenLastCalledWith(["ada", "alan"]);
    // grace is gone from this state's view; last removable is grace in the
    // original state, so verify against a fresh state too.
    const fresh = setup({ values: ["ada", "alan"] });
    fresh.api.removeLast();
    expect(fresh.setValues).toHaveBeenCalledWith(["alan"]);
  });

  it("disabled blocks open, select, remove and removeLast", () => {
    const { api, setValues, setOpen } = setup({ disabled: true, values: ["ada"] });
    api.openListbox();
    api.select("grace");
    api.remove("ada");
    api.removeLast();
    expect(setValues).not.toHaveBeenCalled();
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("readOnly blocks the same actions but review still works", () => {
    const { api, setValues, setOpen } = setup({ readOnly: true, values: ["ada", "ghost"] });
    api.openListbox();
    api.select("grace");
    api.remove("ada");
    api.removeLast();
    expect(setValues).not.toHaveBeenCalled();
    expect(setOpen).not.toHaveBeenCalled();
    expect(api.selectedItems.map((item) => item.label)).toEqual(["Ada", "ghost"]);
  });

  it("keeps disappeared values selected with raw labels, still removable", () => {
    const { api, setValues } = setup({ values: ["ghost", "ada"] });
    expect(api.selectedItems[0]).toEqual({ value: "ghost", label: "ghost" });
    api.remove("ghost");
    expect(setValues).toHaveBeenCalledWith(["ada"]);
  });
});

describe("multi select connect — popup and keyboard", () => {
  it("opens with no pre-highlight and closes clearing the highlight", () => {
    const opened = setup();
    opened.api.openListbox();
    expect(opened.setActiveValue).toHaveBeenCalledWith(null);
    expect(opened.setOpen).toHaveBeenCalledWith(true);
    const closing = setup({ open: true, activeValue: "ada" });
    closing.api.closeListbox();
    expect(closing.setOpen).toHaveBeenCalledWith(false);
    expect(closing.setActiveValue).toHaveBeenCalledWith(null);
  });

  it("ArrowDown opens highlighting the first enabled option", () => {
    const { api, setOpen, setActiveValue } = setup();
    const { event } = keydown("ArrowDown");
    (api.inputProps.onKeyDown as (e: Event) => void)(event);
    expect(setActiveValue).toHaveBeenCalledWith("ada");
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("navigation skips disabled options", () => {
    const { api, setActiveValue } = setup({ open: true, activeValue: "grace" });
    (api.inputProps.onKeyDown as (e: Event) => void)(keydown("ArrowDown").event);
    expect(setActiveValue).toHaveBeenCalledWith("edsger");
  });

  it("Enter selects the active option and keeps the popup open", () => {
    const { api, setValues, setOpen } = setup({ open: true, activeValue: "grace" });
    (api.inputProps.onKeyDown as (e: Event) => void)(keydown("Enter").event);
    expect(setValues).toHaveBeenCalledWith(["grace"]);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("Escape closes when open and does nothing when closed", () => {
    const open = setup({ open: true });
    (open.api.inputProps.onKeyDown as (e: Event) => void)(keydown("Escape").event);
    expect(open.setOpen).toHaveBeenCalledWith(false);
    const closed = setup();
    (closed.api.inputProps.onKeyDown as (e: Event) => void)(keydown("Escape").event);
    expect(closed.setOpen).not.toHaveBeenCalled();
  });

  it("Backspace stays a text edit by default and with text present", () => {
    const off = setup({ values: ["ada"] });
    const offKey = keydown("Backspace");
    (off.api.inputProps.onKeyDown as (e: Event) => void)(offKey.event);
    expect(off.setValues).not.toHaveBeenCalled();
    expect(offKey.preventDefault).not.toHaveBeenCalled();

    const typing = setup({ values: ["ada"], removeOnBackspace: true, inputValue: "gr" });
    const typingKey = keydown("Backspace");
    (typing.api.inputProps.onKeyDown as (e: Event) => void)(typingKey.event);
    expect(typing.setValues).not.toHaveBeenCalled();
    expect(typingKey.preventDefault).not.toHaveBeenCalled();
  });

  it("opted-in Backspace removes the last removable value once", () => {
    const { api, setValues } = setup({
      values: ["ada", "grace", "alan"],
      removeOnBackspace: true,
    });
    const { event, preventDefault } = keydown("Backspace");
    (api.inputProps.onKeyDown as (e: Event) => void)(event);
    expect(preventDefault).toHaveBeenCalled();
    expect(setValues).toHaveBeenCalledTimes(1);
    expect(setValues).toHaveBeenCalledWith(["ada", "alan"]);
  });
});

describe("multi select connect — semantics", () => {
  it("wires the multiselectable listbox and a valid activedescendant", () => {
    const { api } = setup({ open: true, activeValue: "grace" });
    expect(api.listboxProps["aria-multiselectable"]).toBe("true");
    expect(api.inputProps["aria-activedescendant"]).toBe("ms-option-grace");
    const closed = setup().api;
    expect(closed.inputProps["aria-activedescendant"]).toBeUndefined();
  });

  it("keeps selected options listed with aria-selected on every option", () => {
    const { api } = setup({ values: ["ada"] });
    expect(api.getOptionProps("ada")["aria-selected"]).toBe(true);
    expect(api.getOptionProps("grace")["aria-selected"]).toBe(false);
    expect(api.getOptionProps("alan")["aria-disabled"]).toBe(true);
  });

  it("marks the input for disabled and read-only states", () => {
    expect(setup({ readOnly: true }).api.inputProps.readonly).toBe(true);
    expect(setup({ disabled: true }).api.inputProps["aria-disabled"]).toBe(true);
  });

  it("no-op paths never reach any setter", () => {
    const { api, setValues, setOpen, setActiveValue, setInputValue } = setup({
      values: ["ada"],
      max: 1,
    });
    api.select("ada");
    api.select("grace");
    api.remove("missing");
    api.closeListbox();
    expect(setValues).not.toHaveBeenCalled();
    expect(setOpen).not.toHaveBeenCalled();
    expect(setActiveValue).not.toHaveBeenCalled();
    expect(setInputValue).not.toHaveBeenCalled();
  });
});
