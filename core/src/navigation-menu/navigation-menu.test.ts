import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { contentId, hoverClose, hoverOpen, initialState, pressTrigger, triggerId } from "./state";
import type { NavigationMenuState } from "./types";

const at = (value: string | null, kept: boolean): NavigationMenuState => ({ value, kept, id: "n" });

describe("navigation-menu state", () => {
  it("defaults to nothing open with a generated id", () => {
    const s = initialState();
    expect(s.value).toBeNull();
    expect(s.kept).toBe(false);
    expect(s.id).toMatch(/^ds-navigation-menu-\d+$/);
  });

  it("keeps an item open from the start", () => {
    expect(initialState({ value: "a" }).kept).toBe(true);
  });

  it("a press keeps a panel the pointer opened, and a second press closes it", () => {
    const hovered = hoverOpen(at(null, false), "a");
    expect(hovered).toMatchObject({ value: "a", kept: false });
    const pressed = pressTrigger(hovered, "a");
    expect(pressed).toMatchObject({ value: "a", kept: true });
    expect(pressTrigger(pressed, "a")).toMatchObject({ value: null, kept: false });
    expect(pressTrigger(at(null, false), "a")).toMatchObject({ value: "a", kept: true });
    expect(pressTrigger(at("a", true), "b")).toMatchObject({ value: "b", kept: true });
  });

  it("the pointer leaving closes only a panel no press kept", () => {
    expect(hoverClose(at("a", false)).value).toBeNull();
    const kept = at("a", true);
    expect(hoverClose(kept)).toBe(kept);
  });

  it("switching by hover keeps a kept menu kept", () => {
    expect(hoverOpen(at("a", true), "b")).toMatchObject({ value: "b", kept: true });
    expect(hoverOpen(at("a", false), "b")).toMatchObject({ value: "b", kept: false });
    const same = at("a", false);
    expect(hoverOpen(same, "a")).toBe(same);
  });
});

describe("navigation-menu connect", () => {
  it("wires a closed trigger", () => {
    const api = connect({ state: initialState({ id: "n" }), setValue: () => {} });
    const t = api.getTriggerProps("products");
    expect(t.id).toBe(triggerId("n", "products"));
    expect(t["aria-expanded"]).toBe(false);
    expect(t["aria-controls"]).toBeUndefined();
    expect(t["data-current"]).toBeUndefined();
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

  it("a click keeps a hovered panel open, then closes it", () => {
    const setValue = vi.fn();
    connect({ state: at(null, false), setValue }).toggle("a");
    expect(setValue).toHaveBeenLastCalledWith("a", true);

    const hovered = connect({ state: at("a", false), setValue });
    (hovered.getTriggerProps("a").onClick as () => void)();
    expect(setValue).toHaveBeenLastCalledWith("a", true);

    connect({ state: at("a", true), setValue }).toggle("a");
    expect(setValue).toHaveBeenLastCalledWith(null, false);
  });

  it("hover opens and the pointer leaving closes, unless a press kept it", () => {
    const setValue = vi.fn();
    connect({ state: at(null, false), setValue }).hoverOpen("a");
    expect(setValue).toHaveBeenLastCalledWith("a", false);
    connect({ state: at("a", false), setValue }).hoverClose();
    expect(setValue).toHaveBeenLastCalledWith(null, false);
    setValue.mockClear();
    connect({ state: at("a", true), setValue }).hoverClose();
    expect(setValue).not.toHaveBeenCalled();
  });

  it("opens and keeps on ArrowDown and closes on Escape", () => {
    const setValue = vi.fn();
    const api = connect({ state: at(null, false), setValue });
    (api.getTriggerProps("a").onKeyDown as (e: Event) => void)({
      key: "ArrowDown",
      preventDefault() {},
    } as unknown as Event);
    expect(setValue).toHaveBeenLastCalledWith("a", true);

    const setValue2 = vi.fn();
    const open = connect({ state: at("a", true), setValue: setValue2 });
    (open.getContentProps("a").onKeyDown as (e: Event) => void)({
      key: "Escape",
    } as unknown as Event);
    expect(setValue2).toHaveBeenLastCalledWith(null, false);
  });

  it("marks the current link as the page and its trigger visually only", () => {
    const api = connect({ state: at(null, false), setValue: () => {} });
    const link = api.getLinkProps({ current: true });
    expect(link["aria-current"]).toBe("page");
    expect(link["data-current"]).toBe("");
    const other = api.getLinkProps();
    expect(other["aria-current"]).toBeUndefined();
    const trigger = api.getTriggerProps("a", { holdsCurrent: true });
    expect(trigger["data-current"]).toBe("");
    expect(trigger["aria-current"]).toBeUndefined();
  });

  it("a link click closes the open panel", () => {
    const setValue = vi.fn();
    const api = connect({ state: at("a", true), setValue });
    (api.getLinkProps().onClick as () => void)();
    expect(setValue).toHaveBeenLastCalledWith(null, false);
    setValue.mockClear();
    (connect({ state: at(null, false), setValue }).getLinkProps().onClick as () => void)();
    expect(setValue).not.toHaveBeenCalled();
  });
});
