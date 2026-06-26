import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";

describe("button-group state", () => {
  it("defaults to a horizontal group with no label", () => {
    expect(initialState()).toEqual({ orientation: "horizontal", label: undefined });
  });

  it("accepts an orientation and a label", () => {
    expect(initialState({ orientation: "vertical", label: "Actions" })).toEqual({
      orientation: "vertical",
      label: "Actions",
    });
  });
});

describe("button-group connect", () => {
  it("exposes a labelled role=group with its orientation", () => {
    const api = connect({
      state: { orientation: "horizontal", label: "Text alignment" },
    });
    expect(api.groupProps.role).toBe("group");
    expect(api.groupProps["aria-label"]).toBe("Text alignment");
    expect(api.groupProps["data-orientation"]).toBe("horizontal");
    // aria-orientation is not allowed on role="group".
    expect(api.groupProps["aria-orientation"]).toBeUndefined();
  });

  it("reflects the vertical orientation as a styling hook", () => {
    const api = connect({ state: { orientation: "vertical" } });
    expect(api.groupProps["data-orientation"]).toBe("vertical");
  });
});
