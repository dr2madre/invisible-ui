import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { contentId, initialState, triggerId } from "./state";

const make = (overrides = {}) => initialState({ id: "x", ...overrides });

describe("collapsible state", () => {
  it("defaults to closed and enabled, with a generated id", () => {
    const s = initialState();
    expect(s.open).toBe(false);
    expect(s.disabled).toBe(false);
    expect(s.id).toMatch(/^ds-collapsible-\d+$/);
  });

  it("derives linked trigger and content ids from the base id", () => {
    expect(triggerId("x")).toBe("x-trigger");
    expect(contentId("x")).toBe("x-content");
  });
});

describe("collapsible connect", () => {
  const noop = () => {};

  it("links trigger and content and reflects the closed state", () => {
    const api = connect({ state: make(), setOpen: noop });
    expect(api.triggerProps.type).toBe("button");
    expect(api.triggerProps.id).toBe("x-trigger");
    expect(api.triggerProps["aria-expanded"]).toBe(false);
    expect(api.triggerProps["aria-controls"]).toBe("x-content");
    expect(api.contentProps.id).toBe("x-content");
    expect(api.contentProps.hidden).toBe(true);
    expect(api.contentProps["data-state"]).toBe("closed");
  });

  it("reflects the open state on every part", () => {
    const api = connect({ state: make({ open: true }), setOpen: noop });
    expect(api.triggerProps["aria-expanded"]).toBe(true);
    expect(api.rootProps["data-state"]).toBe("open");
    expect(api.contentProps.hidden).toBe(false);
  });

  it("toggles open on click", () => {
    const setOpen = vi.fn();
    const api = connect({ state: make(), setOpen });
    (api.triggerProps.onClick as () => void)();
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("toggles closed when already open", () => {
    const setOpen = vi.fn();
    const api = connect({ state: make({ open: true }), setOpen });
    api.toggle();
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("ignores interaction and marks the trigger disabled when disabled", () => {
    const setOpen = vi.fn();
    const api = connect({ state: make({ disabled: true }), setOpen });
    expect(api.triggerProps.disabled).toBe(true);
    expect(api.rootProps["data-disabled"]).toBe("");
    (api.triggerProps.onClick as () => void)();
    api.setOpen(true);
    expect(setOpen).not.toHaveBeenCalled();
  });
});
