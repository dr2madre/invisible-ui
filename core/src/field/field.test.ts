import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";

const make = (overrides = {}) => initialState({ id: "f", ...overrides });

describe("field state", () => {
  it("defaults to enabled, valid, optional", () => {
    const s = initialState();
    expect(s.required).toBe(false);
    expect(s.invalid).toBe(false);
    expect(s.disabled).toBe(false);
    expect(s.id).toMatch(/^ds-field-\d+$/);
  });
});

describe("field connect", () => {
  it("links the label to the control and exposes part ids", () => {
    const api = connect({ state: make() });
    expect(api.ids).toEqual({
      label: "f-label",
      control: "f-control",
      description: "f-description",
      error: "f-error",
    });
    expect(api.labelProps.for).toBe("f-control");
    expect(api.controlProps.id).toBe("f-control");
  });

  it("describes the control by description and error when present", () => {
    expect(connect({ state: make() }).controlProps["aria-describedby"]).toBeUndefined();
    expect(
      connect({ state: make({ hasDescription: true }) }).controlProps["aria-describedby"],
    ).toBe("f-description");
    expect(
      connect({ state: make({ hasDescription: true, hasError: true }) }).controlProps[
        "aria-describedby"
      ],
    ).toBe("f-description f-error");
  });

  it("reflects invalid and required on the control and container", () => {
    const api = connect({ state: make({ invalid: true, required: true, hasError: true }) });
    expect(api.controlProps["aria-invalid"]).toBe(true);
    expect(api.controlProps["aria-required"]).toBe(true);
    expect(api.rootProps["data-invalid"]).toBe("");
    expect(api.errorProps["aria-live"]).toBe("polite");
  });

  it("marks the control disabled when the field is disabled", () => {
    const api = connect({ state: make({ disabled: true }) });
    expect(api.controlProps.disabled).toBe(true);
    expect(api.rootProps["data-disabled"]).toBe("");
  });
});
