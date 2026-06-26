import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, inputId, labelId, listboxId, optionId } from "./state";

const items = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry", disabled: true },
];

function setup(over: Partial<Parameters<typeof connect>[0]> = {}) {
  const setValue = vi.fn();
  const setOpen = vi.fn();
  const setActiveValue = vi.fn();
  const setInputValue = vi.fn();
  const state = initialState({ id: "c", items });
  const api = connect({ state, setValue, setOpen, setActiveValue, setInputValue, ...over });
  return { api, setValue, setOpen, setActiveValue, setInputValue };
}

describe("combobox state", () => {
  it("defaults to closed, empty, no selection", () => {
    const s = initialState({ items });
    expect(s.open).toBe(false);
    expect(s.value).toBeNull();
    expect(s.inputValue).toBe("");
    expect(s.id).toMatch(/^ds-combobox-\d+$/);
  });
});

describe("combobox connect", () => {
  it("wires the editable combobox input ARIA", () => {
    const { api } = setup();
    expect(api.inputProps.id).toBe(inputId("c"));
    expect(api.inputProps.role).toBe("combobox");
    expect(api.inputProps["aria-autocomplete"]).toBe("list");
    expect(api.inputProps["aria-controls"]).toBe(listboxId("c"));
    expect(api.inputProps["aria-expanded"]).toBe(false);
    expect(api.inputProps["aria-labelledby"]).toBe(labelId("c"));
    expect(api.labelProps.for).toBe(inputId("c"));
  });

  it("opens with ArrowDown, highlighting the first enabled option", () => {
    const { api, setOpen, setActiveValue } = setup();
    (api.inputProps.onKeyDown as (e: Event) => void)({
      key: "ArrowDown",
      preventDefault() {},
    } as unknown as Event);
    expect(setOpen).toHaveBeenCalledWith(true);
    expect(setActiveValue).toHaveBeenCalledWith("apple");
  });

  it("exposes aria-activedescendant for the active option when open", () => {
    const openApi = connect({
      state: { ...initialState({ id: "c", items }), open: true, activeValue: "banana" },
      setValue: vi.fn(),
      setOpen: vi.fn(),
      setActiveValue: vi.fn(),
      setInputValue: vi.fn(),
    });
    expect(openApi.inputProps["aria-activedescendant"]).toBe(optionId("c", "banana"));
  });

  it("selects on Enter: sets value, fills input, closes", () => {
    const setValue = vi.fn();
    const setOpen = vi.fn();
    const setInputValue = vi.fn();
    const api = connect({
      state: { ...initialState({ id: "c", items }), open: true, activeValue: "banana" },
      setValue,
      setOpen,
      setActiveValue: vi.fn(),
      setInputValue,
    });
    (api.inputProps.onKeyDown as (e: Event) => void)({
      key: "Enter",
      preventDefault() {},
    } as unknown as Event);
    expect(setValue).toHaveBeenCalledWith("banana");
    expect(setInputValue).toHaveBeenCalledWith("Banana");
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("does not select a disabled option", () => {
    const setValue = vi.fn();
    const api = connect({
      state: { ...initialState({ id: "c", items }), open: true, activeValue: "cherry" },
      setValue,
      setOpen: vi.fn(),
      setActiveValue: vi.fn(),
      setInputValue: vi.fn(),
    });
    api.select("cherry");
    expect(setValue).not.toHaveBeenCalled();
  });

  it("Escape closes; clear resets value and text", () => {
    const setOpen = vi.fn();
    const setValue = vi.fn();
    const setInputValue = vi.fn();
    const api = connect({
      state: { ...initialState({ id: "c", items }), open: true },
      setValue,
      setOpen,
      setActiveValue: vi.fn(),
      setInputValue,
    });
    (api.inputProps.onKeyDown as (e: Event) => void)({
      key: "Escape",
      preventDefault() {},
    } as unknown as Event);
    expect(setOpen).toHaveBeenCalledWith(false);

    api.clear();
    expect(setValue).toHaveBeenCalledWith(null);
    expect(setInputValue).toHaveBeenCalledWith("");
  });

  it("marks the selected and disabled options", () => {
    const api = connect({
      state: { ...initialState({ id: "c", items }), value: "apple", open: true },
      setValue: vi.fn(),
      setOpen: vi.fn(),
      setActiveValue: vi.fn(),
      setInputValue: vi.fn(),
    });
    expect(api.getOptionProps("apple")["aria-selected"]).toBe(true);
    expect(api.getOptionProps("cherry")["aria-disabled"]).toBe(true);
  });
});
