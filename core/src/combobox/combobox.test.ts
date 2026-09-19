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
  const setCommittedInputValue = vi.fn();
  const state = initialState({ id: "c", items });
  const api = connect({
    state,
    setValue,
    setOpen,
    setActiveValue,
    setInputValue,
    setCommittedInputValue,
    ...over,
  });
  return { api, setValue, setOpen, setActiveValue, setInputValue, setCommittedInputValue };
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
      setCommittedInputValue: vi.fn(),
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
      setCommittedInputValue: vi.fn(),
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
      setCommittedInputValue: vi.fn(),
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
      setCommittedInputValue: vi.fn(),
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
      setCommittedInputValue: vi.fn(),
    });
    expect(api.getOptionProps("apple")["aria-selected"]).toBe(true);
    expect(api.getOptionProps("cherry")["aria-disabled"]).toBe(true);
  });
});

describe("combobox commit boundary", () => {
  const harness = (over: Record<string, unknown> = {}) => {
    let state = { ...initialState({ items, id: "c" }), open: true, ...over };
    const reported: string[] = [];
    const api = (options: Record<string, unknown> = {}) =>
      connect({
        state,
        setOpen: (open) => {
          state = { ...state, open };
        },
        setValue: (value) => {
          state = { ...state, value };
        },
        setActiveValue: (activeValue) => {
          state = { ...state, activeValue };
        },
        setInputValue: (inputValue) => {
          state = { ...state, inputValue };
          reported.push(inputValue);
        },
        setCommittedInputValue: (committedInputValue) => {
          state = { ...state, committedInputValue };
        },
        ...options,
      });
    return { api, reported, text: () => state.inputValue, open: () => state.open };
  };

  it("puts the text back to the selection when focus leaves", () => {
    const h = harness({ value: "apple", inputValue: "ba", committedInputValue: "Apple" });
    (h.api().inputProps.onBlur as () => void)();
    // "ba" was a filter, never a value: leaving must not imply it was chosen.
    expect(h.text()).toBe("Apple");
    expect(h.open()).toBe(false);
    // The visible text really changed, so the change is reported.
    expect(h.reported).toEqual(["Apple"]);
  });

  it("empties the text when nothing was ever chosen", () => {
    const h = harness({ value: null, inputValue: "ba", committedInputValue: "" });
    (h.api().inputProps.onBlur as () => void)();
    expect(h.text()).toBe("");
  });

  it("leaves a text that already matches the selection alone", () => {
    const h = harness({ value: "banana", inputValue: "Banana", committedInputValue: "Banana" });
    (h.api().inputProps.onBlur as () => void)();
    expect(h.reported).toEqual([]);
  });

  it("reverts on Escape as well as closing", () => {
    const h = harness({ value: "apple", inputValue: "ba", committedInputValue: "Apple" });
    (h.api().inputProps.onKeyDown as (e: Event) => void)({
      key: "Escape",
      preventDefault() {},
    } as unknown as Event);
    expect(h.text()).toBe("Apple");
    expect(h.open()).toBe(false);
  });

  it("ignores Escape while the list is closed, so an outer layer still sees it", () => {
    const h = harness({
      open: false,
      value: "apple",
      inputValue: "ba",
      committedInputValue: "Apple",
    });
    let prevented = false;
    (h.api().inputProps.onKeyDown as (e: Event) => void)({
      key: "Escape",
      preventDefault() {
        prevented = true;
      },
    } as unknown as Event);
    expect(prevented).toBe(false);
    expect(h.text()).toBe("ba");
  });

  it("settles nothing on blur when the consumer opts out", () => {
    const h = harness({ value: null, inputValue: "cake", committedInputValue: "" });
    (h.api({ settleOnBlur: false }).inputProps.onBlur as () => void)();
    // A search query is what the user wrote, and the surface showing it is
    // dismissed by whatever owns it, not by losing focus.
    expect(h.text()).toBe("cake");
    expect(h.open()).toBe(true);
  });

  it("records the chosen label as the text to come back to", () => {
    const h = harness({ inputValue: "ba" });
    (h.api().getOptionProps("banana").onMouseDown as (e: Event) => void)({
      preventDefault() {},
    } as unknown as Event);
    (h.api().inputProps.onBlur as () => void)();
    expect(h.text()).toBe("Banana");
  });

  it("a disabled combobox opens from neither the API nor the arrows", () => {
    const { api, setOpen, setActiveValue } = setup({
      state: { ...initialState({ id: "c", items }), disabled: true },
    });
    api.openListbox();
    for (const key of ["ArrowDown", "ArrowUp"]) {
      (api.inputProps.onKeyDown as (e: unknown) => void)({ key, preventDefault() {} });
    }
    expect(setOpen).not.toHaveBeenCalled();
    expect(setActiveValue).not.toHaveBeenCalled();
    expect(api.inputProps["aria-expanded"]).toBe(false);
  });

  it("a disabled combobox answers no key, and cancels none", () => {
    const openDisabled = () => ({
      ...initialState({ id: "c", items }),
      open: true,
      disabled: true,
      activeValue: "apple",
      inputValue: "ba",
      committedInputValue: "Apple",
    });
    for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab", "Home"]) {
      const h = setup({ state: openDisabled() });
      const event = {
        key,
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
      };
      (h.api.inputProps.onKeyDown as (e: unknown) => void)(event);
      expect(h.setActiveValue, key).not.toHaveBeenCalled();
      expect(h.setValue, key).not.toHaveBeenCalled();
      expect(h.setOpen, key).not.toHaveBeenCalled();
      expect(h.setInputValue, key).not.toHaveBeenCalled();
      // The key is left to the page: an input that is still focusable keeps
      // its caret keys.
      expect(event.defaultPrevented, key).toBe(false);
    }
  });

  it("clears from the keyboard, and hands focus back to the input", () => {
    // The clear button is the only thing that takes focus off the input, and
    // it stops being a button the moment it works: whoever pressed it has to
    // be put back somewhere.
    const focusInput = vi.fn();
    const { api, setValue, setInputValue } = setup({
      state: { ...initialState({ id: "c", items }), value: "apple", inputValue: "Apple" },
      focusInput,
    });

    for (const key of ["Enter", " "]) {
      setValue.mockClear();
      setInputValue.mockClear();
      focusInput.mockClear();
      const event = { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;
      (api.clearProps.onKeyDown as (e: KeyboardEvent) => void)(event);

      expect(setValue, key).toHaveBeenCalledWith(null);
      expect(setInputValue, key).toHaveBeenCalledWith("");
      expect(focusInput, key).toHaveBeenCalledTimes(1);
      // The page must not scroll on Space, nor submit a form on Enter.
      expect(event.preventDefault, key).toHaveBeenCalled();
    }
  });

  it("leaves every other key on the clear button alone", () => {
    const { api, setValue } = setup({
      state: { ...initialState({ id: "c", items }), value: "apple", inputValue: "Apple" },
    });
    for (const key of ["a", "Tab", "Escape", "ArrowDown"]) {
      const event = { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;
      (api.clearProps.onKeyDown as (e: KeyboardEvent) => void)(event);
      expect(setValue, key).not.toHaveBeenCalled();
      expect(event.preventDefault, key).not.toHaveBeenCalled();
    }
  });

  it("puts the clear button in the tab sequence only while it has work to do", () => {
    const empty = setup();
    expect(empty.api.clearProps.tabindex, "nothing to clear").toBe(-1);

    const filled = setup({
      state: { ...initialState({ id: "c", items }), value: "apple", inputValue: "Apple" },
    });
    expect(filled.api.clearProps.tabindex, "a value to clear").toBe(0);

    const typed = setup({
      state: { ...initialState({ id: "c", items }), inputValue: "app" },
    });
    expect(typed.api.clearProps.tabindex, "text with no selection").toBe(0);

    const off = setup({
      state: {
        ...initialState({ id: "c", items }),
        value: "apple",
        inputValue: "Apple",
        disabled: true,
      },
    });
    expect(off.api.clearProps.tabindex, "disabled").toBe(-1);
  });

  it("a disabled combobox is not cleared, and takes no highlight from the pointer", () => {
    const state = { ...initialState({ id: "c", items }), open: true, disabled: true };
    const { api, setValue, setInputValue, setActiveValue } = setup({
      state: { ...state, value: "apple", inputValue: "Apple" },
    });
    api.clear();
    expect(setValue).not.toHaveBeenCalled();
    expect(setInputValue).not.toHaveBeenCalled();
    expect(api.clearProps.disabled).toBe(true);

    (api.getOptionProps("banana").onMouseEnter as () => void)();
    expect(
      setActiveValue,
      "the pointer moved the highlight of a disabled list",
    ).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const h = harness({
      value: "apple",
      inputValue: "ba",
      committedInputValue: "Apple",
      disabled: true,
    });
    (h.api().inputProps.onBlur as () => void)();
    expect(h.text()).toBe("ba");
  });
});
