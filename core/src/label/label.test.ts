import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";

describe("label state", () => {
  it("defaults to no associations", () => {
    const s = initialState();
    expect(s.for).toBeNull();
    expect(s.id).toBeNull();
  });

  it("carries the provided ids", () => {
    const s = initialState({ for: "email", id: "email-label" });
    expect(s.for).toBe("email");
    expect(s.id).toBe("email-label");
  });
});

describe("label connect", () => {
  it("exposes the for/id association", () => {
    const api = connect({ state: initialState({ for: "email", id: "email-label" }) });
    expect(api.rootProps.for).toBe("email");
    expect(api.rootProps.id).toBe("email-label");
  });

  it("omits unset attributes", () => {
    const api = connect({ state: initialState() });
    expect(api.rootProps.for).toBeUndefined();
    expect(api.rootProps.id).toBeUndefined();
  });

  it("prevents text selection on a double-click but not a single click", () => {
    const api = connect({ state: initialState({ for: "x" }) });
    const onMouseDown = api.rootProps.onMouseDown as (e: Event) => void;

    const single = { detail: 1, defaultPrevented: false, preventDefault: vi.fn() };
    onMouseDown(single as unknown as Event);
    expect(single.preventDefault).not.toHaveBeenCalled();

    const double = { detail: 2, defaultPrevented: false, preventDefault: vi.fn() };
    onMouseDown(double as unknown as Event);
    expect(double.preventDefault).toHaveBeenCalled();
  });
});
