import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { contentId, initialState, triggerId } from "./state";

describe("hover-card state", () => {
  it("defaults to closed with a generated id", () => {
    const state = initialState();
    expect(state.open).toBe(false);
    expect(state.id).toMatch(/^ds-hover-card-\d+$/);
  });
});

describe("hover-card connect", () => {
  it("exposes ids and data-state on both parts", () => {
    const closed = connect({ state: initialState({ id: "h" }) });
    expect(closed.triggerProps.id).toBe(triggerId("h"));
    expect(closed.contentProps.id).toBe(contentId("h"));
    expect(closed.triggerProps["data-state"]).toBe("closed");
    expect(closed.contentProps["data-state"]).toBe("closed");

    const open = connect({ state: initialState({ id: "h", open: true }) });
    expect(open.triggerProps["data-state"]).toBe("open");
    expect(open.contentProps["data-state"]).toBe("open");
  });

  it("stays supplementary: no dialog role or aria-haspopup", () => {
    const api = connect({ state: initialState({ open: true }) });
    expect(api.contentProps.role).toBeUndefined();
    expect(api.triggerProps["aria-haspopup"]).toBeUndefined();
  });
});
