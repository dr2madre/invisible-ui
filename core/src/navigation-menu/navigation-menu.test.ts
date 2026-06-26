import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { contentId, initialState, triggerId } from "./state";

describe("navigation-menu state", () => {
  it("defaults to nothing open with a generated id", () => {
    const s = initialState();
    expect(s.value).toBeNull();
    expect(s.id).toMatch(/^ds-navigation-menu-\d+$/);
  });
});

describe("navigation-menu connect", () => {
  it("wires a closed trigger", () => {
    const api = connect({ state: initialState({ id: "n" }), setValue: () => {} });
    const t = api.getTriggerProps("products");
    expect(t.id).toBe(triggerId("n", "products"));
    expect(t["aria-expanded"]).toBe(false);
    expect(t["aria-controls"]).toBeUndefined();
  });

  it("reports the open item and links content", () => {
    const api = connect({
      state: initialState({ id: "n", value: "products" }),
      setValue: () => {},
    });
    expect(api.isOpen("products")).toBe(true);
    expect(api.getTriggerProps("products")["aria-expanded"]).toBe(true);
    expect(api.getTriggerProps("products")["aria-controls"]).toBe(contentId("n", "products"));
    expect(api.getContentProps("products")["aria-labelledby"]).toBe(triggerId("n", "products"));
  });

  it("toggles open/closed on the same value", () => {
    const setValue = vi.fn();
    connect({ state: initialState({ value: null }), setValue }).toggle("a");
    expect(setValue).toHaveBeenLastCalledWith("a");

    setValue.mockClear();
    connect({ state: initialState({ value: "a" }), setValue }).toggle("a");
    expect(setValue).toHaveBeenLastCalledWith(null);
  });

  it("opens on ArrowDown and closes on Escape", () => {
    const setValue = vi.fn();
    const api = connect({ state: initialState({ value: null }), setValue });
    (api.getTriggerProps("a").onKeyDown as (e: Event) => void)({
      key: "ArrowDown",
      preventDefault() {},
    } as unknown as Event);
    expect(setValue).toHaveBeenLastCalledWith("a");

    const setValue2 = vi.fn();
    const open = connect({ state: initialState({ value: "a" }), setValue: setValue2 });
    (open.getContentProps("a").onKeyDown as (e: Event) => void)({
      key: "Escape",
    } as unknown as Event);
    expect(setValue2).toHaveBeenLastCalledWith(null);
  });
});
