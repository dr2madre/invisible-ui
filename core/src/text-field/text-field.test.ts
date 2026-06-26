import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { controlId, descriptionId, errorId, initialState, labelId } from "./state";
import type { TextFieldState } from "./types";

const stateFor = (overrides: Partial<TextFieldState> = {}): TextFieldState => ({
  value: "",
  disabled: false,
  readOnly: false,
  required: false,
  invalid: false,
  hasDescription: false,
  id: "fld",
  ...overrides,
});

describe("text-field state", () => {
  it("defaults to an empty, enabled, valid field with a generated id", () => {
    const state = initialState();
    expect(state.value).toBe("");
    expect(state.disabled).toBe(false);
    expect(state.invalid).toBe(false);
    expect(state.id).toMatch(/^ds-field-\d+$/);
  });

  it("derives part ids from a base id", () => {
    expect(labelId("x")).toBe("x-label");
    expect(controlId("x")).toBe("x-control");
    expect(descriptionId("x")).toBe("x-description");
    expect(errorId("x")).toBe("x-error");
  });
});

describe("text-field connect", () => {
  const noop = () => {};

  it("ties the label to the control via for/id", () => {
    const api = connect({ state: stateFor(), setValue: noop });
    expect(api.labelProps.for).toBe(controlId("fld"));
    expect(api.controlProps.id).toBe(controlId("fld"));
    expect(api.labelProps.id).toBe(labelId("fld"));
  });

  it("omits aria-describedby when there is no description or error", () => {
    const api = connect({ state: stateFor(), setValue: noop });
    expect(api.controlProps["aria-describedby"]).toBeUndefined();
  });

  it("describes by the description id when a description is present", () => {
    const api = connect({ state: stateFor({ hasDescription: true }), setValue: noop });
    expect(api.controlProps["aria-describedby"]).toBe(descriptionId("fld"));
  });

  it("describes by both description and error when invalid", () => {
    const api = connect({
      state: stateFor({ hasDescription: true, invalid: true }),
      setValue: noop,
    });
    expect(api.controlProps["aria-describedby"]).toBe(`${descriptionId("fld")} ${errorId("fld")}`);
    expect(api.controlProps["aria-invalid"]).toBe(true);
    expect(api.controlProps["data-invalid"]).toBe("");
    expect(api.errorProps.role).toBe("alert");
  });

  it("reflects required and disabled", () => {
    const api = connect({
      state: stateFor({ required: true, disabled: true }),
      setValue: noop,
    });
    expect(api.controlProps.required).toBe(true);
    expect(api.controlProps["aria-required"]).toBe(true);
    expect(api.controlProps.disabled).toBe(true);
    expect(api.controlProps["data-disabled"]).toBe("");
  });

  it("sets the value but ignores changes when disabled or read-only", () => {
    const setValue = vi.fn();
    connect({ state: stateFor(), setValue }).setValue("a");
    expect(setValue).toHaveBeenCalledWith("a");

    setValue.mockClear();
    connect({ state: stateFor({ disabled: true }), setValue }).setValue("b");
    connect({ state: stateFor({ readOnly: true }), setValue }).setValue("c");
    expect(setValue).not.toHaveBeenCalled();
  });
});
