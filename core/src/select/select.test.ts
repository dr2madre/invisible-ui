import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, matchOption, optionId } from "./state";
import type { SelectItem, SelectState } from "./types";

const items: SelectItem[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry", disabled: true },
  { value: "date", label: "Date" },
];

const stateFor = (overrides: Partial<SelectState> = {}): SelectState => ({
  open: false,
  value: null,
  activeValue: null,
  items,
  disabled: false,
  id: "sel",
  ...overrides,
});

const harness = (overrides: Partial<SelectState> = {}) => {
  const setValue = vi.fn();
  const setOpen = vi.fn();
  const setActiveValue = vi.fn();
  const api = connect({ state: stateFor(overrides), setValue, setOpen, setActiveValue });
  return { api, setValue, setOpen, setActiveValue };
};

const key = (k: string) => ({ key: k, preventDefault: vi.fn() }) as unknown as Event;

describe("select state", () => {
  it("defaults to closed with no selection", () => {
    const state = initialState({ items });
    expect(state.open).toBe(false);
    expect(state.value).toBeNull();
    expect(state.id).toMatch(/^ds-select-\d+$/);
  });

  it("matches typeahead against labels, skipping disabled and wrapping", () => {
    expect(matchOption(items, "b", null)).toBe("banana");
    expect(matchOption(items, "c", null)).toBeNull(); // cherry is disabled
    expect(matchOption(items, "a", "date")).toBe("apple"); // wraps around
    expect(matchOption(items, "", null)).toBeNull();
  });
});

describe("select connect", () => {
  it("exposes a combobox trigger linked to the listbox", () => {
    const { api } = harness();
    expect(api.triggerProps.role).toBe("combobox");
    expect(api.triggerProps["aria-haspopup"]).toBe("listbox");
    expect(api.triggerProps["aria-expanded"]).toBe(false);
    expect(api.triggerProps["aria-controls"]).toBe("sel-listbox");
    expect(api.listboxProps.role).toBe("listbox");
  });

  it("opens highlighting the selected option and reports activedescendant", () => {
    const { api, setOpen, setActiveValue } = harness({ value: "banana" });
    api.openListbox();
    expect(setActiveValue).toHaveBeenCalledWith("banana");
    expect(setOpen).toHaveBeenCalledWith(true);

    // When open with an active option, the trigger points at it.
    const open = harness({ open: true, value: "banana", activeValue: "banana" });
    expect(open.api.triggerProps["aria-activedescendant"]).toBe(optionId("sel", "banana"));
  });

  it("moves the active option with the arrow keys, skipping disabled", () => {
    const { api, setActiveValue } = harness({ open: true, activeValue: "banana" });
    (api.triggerProps.onKeyDown as (e: Event) => void)(key("ArrowDown"));
    // banana -> (cherry disabled) -> date
    expect(setActiveValue).toHaveBeenCalledWith("date");
  });

  it("selects the active option on Enter and closes", () => {
    const { api, setValue, setOpen } = harness({ open: true, activeValue: "date" });
    (api.triggerProps.onKeyDown as (e: Event) => void)(key("Enter"));
    expect(setValue).toHaveBeenCalledWith("date");
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("closes on Escape without selecting", () => {
    const { api, setValue, setOpen } = harness({ open: true, activeValue: "date" });
    (api.triggerProps.onKeyDown as (e: Event) => void)(key("Escape"));
    expect(setValue).not.toHaveBeenCalled();
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("marks option state and refuses disabled selection", () => {
    const { api, setValue } = harness({ open: true, value: "apple" });
    expect(api.getOptionProps("apple")["aria-selected"]).toBe(true);
    expect(api.getOptionProps("apple")["data-state"]).toBe("selected");
    expect(api.getOptionProps("cherry")["aria-disabled"]).toBe(true);

    api.select("cherry");
    expect(setValue).not.toHaveBeenCalled();
  });

  it("does not open when disabled", () => {
    const { api, setOpen } = harness({ disabled: true });
    api.openListbox();
    expect(setOpen).not.toHaveBeenCalled();
  });
});
