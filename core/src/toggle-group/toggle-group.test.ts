import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, toggleValue } from "./state";
import type { ToggleGroupItem } from "./types";

const items: ToggleGroupItem[] = [
  { value: "bold" },
  { value: "italic", disabled: true },
  { value: "underline" },
];

const make = (overrides = {}) => initialState({ items, ...overrides });

describe("toggle-group state", () => {
  it("defaults to single, nothing pressed, horizontal", () => {
    const s = initialState({ items });
    expect(s.value).toEqual([]);
    expect(s.type).toBe("single");
    expect(s.orientation).toBe("horizontal");
  });

  it("single: pressing one replaces the other and can clear itself", () => {
    expect(toggleValue(make({ value: ["bold"] }), "underline")).toEqual(["underline"]);
    expect(toggleValue(make({ value: ["bold"] }), "bold")).toEqual([]);
  });

  it("multiple: items toggle independently", () => {
    expect(toggleValue(make({ type: "multiple", value: ["bold"] }), "underline")).toEqual([
      "bold",
      "underline",
    ]);
    expect(toggleValue(make({ type: "multiple", value: ["bold", "underline"] }), "bold")).toEqual([
      "underline",
    ]);
  });
});

describe("toggle-group connect", () => {
  const noop = () => {};

  it("exposes group role and pressed buttons", () => {
    const api = connect({ state: make({ value: ["bold"] }), setValue: noop });
    expect(api.rootProps.role).toBe("group");
    const bold = api.getItemProps("bold");
    expect(bold.type).toBe("button");
    expect(bold["aria-pressed"]).toBe(true);
    expect(bold["data-state"]).toBe("on");
    expect(api.getItemProps("underline")["aria-pressed"]).toBe(false);
  });

  it("puts the single tab stop on the first pressed item", () => {
    const api = connect({ state: make({ value: ["underline"] }), setValue: noop });
    expect(api.getItemProps("underline").tabindex).toBe(0);
    expect(api.getItemProps("bold").tabindex).toBe(-1);
  });

  it("falls back the tab stop to the first enabled item", () => {
    const api = connect({ state: make(), setValue: noop });
    expect(api.getItemProps("bold").tabindex).toBe(0);
  });

  it("toggles on click, ignoring disabled items", () => {
    const setValue = vi.fn();
    const api = connect({ state: make(), setValue });
    (api.getItemProps("bold").onClick as () => void)();
    expect(setValue).toHaveBeenCalledWith(["bold"]);

    setValue.mockClear();
    (api.getItemProps("italic").onClick as () => void)(); // disabled
    expect(setValue).not.toHaveBeenCalled();
    expect(api.getItemProps("italic").disabled).toBe(true);
  });

  it("moves focus with arrows, skipping disabled, without selecting", () => {
    const focus = vi.fn();
    const setValue = vi.fn();
    const api = connect({ state: make(), setValue, focus });
    const keyEvent = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as Event;

    (api.getItemProps("bold").onKeyDown as (e: Event) => void)(keyEvent("ArrowRight"));
    expect(focus).toHaveBeenCalledWith("underline"); // skips disabled "italic"
    expect(setValue).not.toHaveBeenCalled();
  });
});
