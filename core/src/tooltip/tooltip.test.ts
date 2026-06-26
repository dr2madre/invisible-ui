import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { initialState, tooltipId } from "./state";

describe("tooltip", () => {
  it("defaults to closed with a generated id", () => {
    const state = initialState();
    expect(state.open).toBe(false);
    expect(state.id).toMatch(/^ds-tooltip-\d+$/);
  });

  it("links trigger and tooltip only while open", () => {
    const closed = connect({ state: initialState({ id: "t", open: false }) });
    expect(closed.triggerProps["aria-describedby"]).toBeUndefined();
    expect(closed.tooltipProps.id).toBe(tooltipId("t"));
    expect(closed.tooltipProps.role).toBe("tooltip");

    const open = connect({ state: initialState({ id: "t", open: true }) });
    expect(open.triggerProps["aria-describedby"]).toBe(tooltipId("t"));
    expect(open.triggerProps["data-state"]).toBe("open");
    expect(open.tooltipProps["data-state"]).toBe("open");
  });
});
