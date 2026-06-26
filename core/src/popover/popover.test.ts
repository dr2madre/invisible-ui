import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { contentId, initialState, triggerId } from "./state";

describe("popover state", () => {
  it("defaults to closed with a generated id", () => {
    const state = initialState();
    expect(state.open).toBe(false);
    expect(state.id).toMatch(/^ds-popover-\d+$/);
  });
});

describe("popover connect", () => {
  it("wires the trigger to the panel via ARIA", () => {
    const api = connect({ state: initialState({ id: "p" }), setOpen: () => {} });
    expect(api.triggerProps.id).toBe(triggerId("p"));
    expect(api.triggerProps["aria-haspopup"]).toBe("dialog");
    expect(api.triggerProps["aria-expanded"]).toBe(false);
    // aria-controls is only set while open (the panel isn't in the DOM closed).
    expect(api.triggerProps["aria-controls"]).toBeUndefined();
    expect(api.contentProps.id).toBe(contentId("p"));
  });

  it("reports aria-controls and data-state when open", () => {
    const api = connect({ state: initialState({ id: "p", open: true }), setOpen: () => {} });
    expect(api.triggerProps["aria-expanded"]).toBe(true);
    expect(api.triggerProps["aria-controls"]).toBe(contentId("p"));
    expect(api.triggerProps["data-state"]).toBe("open");
    expect(api.contentProps["data-state"]).toBe("open");
  });

  it("toggles open on trigger click", () => {
    const setOpen = vi.fn();
    const api = connect({ state: initialState({ open: false }), setOpen });
    (api.triggerProps.onClick as () => void)();
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("closes on Escape from the content", () => {
    const setOpen = vi.fn();
    const api = connect({ state: initialState({ open: true }), setOpen });
    (api.contentProps.onKeyDown as (e: Event) => void)({
      key: "Escape",
      preventDefault() {},
    } as unknown as Event);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("openPopover/closePopover are no-ops when already in that state", () => {
    const setOpen = vi.fn();
    connect({ state: initialState({ open: false }), setOpen }).closePopover();
    connect({ state: initialState({ open: true }), setOpen }).openPopover();
    expect(setOpen).not.toHaveBeenCalled();
  });
});
