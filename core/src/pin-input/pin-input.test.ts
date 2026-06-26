import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, isComplete, sanitizeChar, splitValue, value } from "./state";

const make = (overrides = {}) => initialState({ id: "x", length: 4, ...overrides });

describe("pin-input state", () => {
  it("defaults to 6 empty numeric cells", () => {
    const s = initialState();
    expect(s.values).toEqual(["", "", "", "", "", ""]);
    expect(s.type).toBe("numeric");
  });

  it("spreads an initial value across cells", () => {
    expect(splitValue("12", 4)).toEqual(["1", "2", "", ""]);
    expect(value(make({ value: "1234" }))).toBe("1234");
    expect(isComplete(make({ value: "1234" }))).toBe(true);
    expect(isComplete(make({ value: "12" }))).toBe(false);
  });

  it("sanitizes characters by type", () => {
    expect(sanitizeChar("5", "numeric")).toBe("5");
    expect(sanitizeChar("a", "numeric")).toBe("");
    expect(sanitizeChar("a", "alphanumeric")).toBe("a");
    expect(sanitizeChar("@", "alphanumeric")).toBe("");
  });
});

describe("pin-input connect", () => {
  const inputEvent = (val: string) => ({ target: { value: val } }) as unknown as Event;

  it("exposes a group with per-cell inputs", () => {
    const api = connect({ state: make(), setValues: () => {} });
    expect(api.rootProps.role).toBe("group");
    const cell = api.getInputProps(0);
    expect(cell.maxlength).toBe(1);
    expect(cell.inputmode).toBe("numeric");
    expect(cell.autocomplete).toBe("one-time-code");
  });

  it("fills a cell with a valid char and advances focus", () => {
    const setValues = vi.fn();
    const focus = vi.fn();
    const api = connect({ state: make(), setValues, focus });
    (api.getInputProps(0).onInput as (e: Event) => void)(inputEvent("7"));
    expect(setValues).toHaveBeenCalledWith(["7", "", "", ""]);
    expect(focus).toHaveBeenCalledWith(1);
  });

  it("rejects a disallowed char", () => {
    const setValues = vi.fn();
    const api = connect({ state: make(), setValues });
    (api.getInputProps(0).onInput as (e: Event) => void)(inputEvent("a"));
    expect(setValues).not.toHaveBeenCalled();
  });

  it("clears on Backspace and steps back when empty", () => {
    const setValues = vi.fn();
    const focus = vi.fn();
    const keydown = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as Event;

    // Cell with a value: clear it, stay.
    let api = connect({ state: make({ value: "12" }), setValues, focus });
    (api.getInputProps(1).onKeyDown as (e: Event) => void)(keydown("Backspace"));
    expect(setValues).toHaveBeenCalledWith(["1", "", "", ""]);

    // Empty cell: clear previous and move back.
    setValues.mockClear();
    api = connect({ state: make({ value: "12" }), setValues, focus });
    (api.getInputProps(2).onKeyDown as (e: Event) => void)(keydown("Backspace"));
    expect(setValues).toHaveBeenCalledWith(["1", "", "", ""]);
    expect(focus).toHaveBeenCalledWith(1);
  });

  it("distributes a pasted string across cells from the index", () => {
    const setValues = vi.fn();
    const focus = vi.fn();
    const api = connect({ state: make(), setValues, focus });
    const paste = {
      preventDefault: vi.fn(),
      clipboardData: { getData: () => "1a23" },
    } as unknown as Event;
    (api.getInputProps(0).onPaste as (e: Event) => void)(paste);
    // "a" is filtered out (numeric); "123" fills cells 0–2.
    expect(setValues).toHaveBeenCalledWith(["1", "2", "3", ""]);
  });
});
