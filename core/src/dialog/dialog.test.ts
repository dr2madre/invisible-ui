import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { contentId, descriptionId, initialState, titleId, triggerId } from "./state";

describe("dialog state", () => {
  it("defaults to closed, role=dialog, generated id", () => {
    const state = initialState();
    expect(state.open).toBe(false);
    expect(state.role).toBe("dialog");
    expect(state.id).toMatch(/^ds-dialog-\d+$/);
  });

  it("accepts the alertdialog role", () => {
    expect(initialState({ role: "alertdialog" }).role).toBe("alertdialog");
  });
});

describe("dialog connect", () => {
  it("wires the trigger to the modal panel via ARIA", () => {
    const api = connect({ state: initialState({ id: "d" }), setOpen: () => {} });
    expect(api.triggerProps.id).toBe(triggerId("d"));
    expect(api.triggerProps["aria-haspopup"]).toBe("dialog");
    expect(api.triggerProps["aria-expanded"]).toBe(false);
    expect(api.triggerProps["aria-controls"]).toBeUndefined(); // closed → panel absent

    expect(api.contentProps.id).toBe(contentId("d"));
    expect(api.contentProps.role).toBe("dialog");
    expect(api.contentProps["aria-modal"]).toBe(true);
    expect(api.contentProps["aria-labelledby"]).toBe(titleId("d"));
    expect(api.titleProps.id).toBe(titleId("d"));
  });

  it("omits aria-describedby unless a description is present", () => {
    const without = connect({ state: initialState({ id: "d" }), setOpen: () => {} });
    expect(without.contentProps["aria-describedby"]).toBeUndefined();

    const withDesc = connect({
      state: initialState({ id: "d" }),
      setOpen: () => {},
      describedBy: true,
    });
    expect(withDesc.contentProps["aria-describedby"]).toBe(descriptionId("d"));
  });

  it("reports the alertdialog role on the panel", () => {
    const api = connect({ state: initialState({ role: "alertdialog" }), setOpen: () => {} });
    expect(api.contentProps.role).toBe("alertdialog");
  });

  it("reports aria-controls and data-state when open", () => {
    const api = connect({ state: initialState({ id: "d", open: true }), setOpen: () => {} });
    expect(api.triggerProps["aria-controls"]).toBe(contentId("d"));
    expect(api.triggerProps["data-state"]).toBe("open");
    expect(api.contentProps["data-state"]).toBe("open");
  });

  it("toggles on trigger click and closes via the close button", () => {
    const setOpen = vi.fn();
    (
      connect({ state: initialState({ open: false }), setOpen }).triggerProps.onClick as (
        e: Event,
      ) => void
    )(undefined as unknown as Event);
    expect(setOpen).toHaveBeenCalledWith(true);

    setOpen.mockClear();
    (connect({ state: initialState({ open: true }), setOpen }).closeProps.onClick as () => void)();
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("closes on Escape, unless closeOnEscape is false", () => {
    const escape = { key: "Escape", preventDefault() {} } as unknown as Event;

    const setOpen = vi.fn();
    (
      connect({ state: initialState({ open: true }), setOpen }).contentProps.onKeyDown as (
        e: Event,
      ) => void
    )(escape);
    expect(setOpen).toHaveBeenCalledWith(false);

    const noEscape = vi.fn();
    (
      connect({
        state: initialState({ open: true }),
        setOpen: noEscape,
        closeOnEscape: false,
      }).contentProps.onKeyDown as (e: Event) => void
    )(escape);
    expect(noEscape).not.toHaveBeenCalled();
  });
});
