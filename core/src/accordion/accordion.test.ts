import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, toggleValue } from "./state";
import type { AccordionItem } from "./types";

const items: AccordionItem[] = [{ value: "a" }, { value: "b", disabled: true }, { value: "c" }];

const make = (overrides = {}) => initialState({ id: "x", items, ...overrides });

describe("accordion state", () => {
  it("defaults to single, collapsible, nothing open", () => {
    const s = initialState({ id: "x", items });
    expect(s.value).toEqual([]);
    expect(s.type).toBe("single");
    expect(s.collapsible).toBe(true);
  });

  it("single: opening one closes the other", () => {
    const s = make({ value: ["a"] });
    expect(toggleValue(s, "c")).toEqual(["c"]);
  });

  it("single collapsible: toggling the open one closes it", () => {
    expect(toggleValue(make({ value: ["a"] }), "a")).toEqual([]);
  });

  it("single non-collapsible: the open one stays open", () => {
    expect(toggleValue(make({ value: ["a"], collapsible: false }), "a")).toEqual(["a"]);
  });

  it("multiple: items toggle independently", () => {
    const s = make({ type: "multiple", value: ["a"] });
    expect(toggleValue(s, "c")).toEqual(["a", "c"]);
    expect(toggleValue(make({ type: "multiple", value: ["a", "c"] }), "a")).toEqual(["c"]);
  });
});

describe("accordion connect", () => {
  const noop = () => {};

  it("links trigger and panel and reflects expanded state", () => {
    const api = connect({ state: make({ value: ["a"] }), setValue: noop });
    const trigger = api.getTriggerProps("a");
    const panel = api.getPanelProps("a");
    expect(trigger.type).toBe("button");
    expect(trigger.id).toBe("x-trigger-a");
    expect(trigger["aria-expanded"]).toBe(true);
    expect(trigger["aria-controls"]).toBe("x-panel-a");
    expect(panel.role).toBe("region");
    expect(panel["aria-labelledby"]).toBe("x-trigger-a");
    expect(panel.hidden).toBe(false);

    expect(api.getPanelProps("c").hidden).toBe(true);
  });

  it("toggles on click, ignoring disabled items", () => {
    const setValue = vi.fn();
    const api = connect({ state: make(), setValue });
    (api.getTriggerProps("a").onClick as () => void)();
    expect(setValue).toHaveBeenCalledWith(["a"]);

    setValue.mockClear();
    (api.getTriggerProps("b").onClick as () => void)(); // disabled
    expect(setValue).not.toHaveBeenCalled();
    expect(api.getTriggerProps("b").disabled).toBe(true);
  });

  it("moves focus between headers, skipping disabled", () => {
    const focus = vi.fn();
    const api = connect({ state: make(), setValue: noop, focus });
    const keyEvent = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as Event;

    (api.getTriggerProps("a").onKeyDown as (e: Event) => void)(keyEvent("ArrowDown"));
    expect(focus).toHaveBeenCalledWith("c"); // skips disabled "b"

    focus.mockClear();
    (api.getTriggerProps("c").onKeyDown as (e: Event) => void)(keyEvent("Home"));
    expect(focus).toHaveBeenCalledWith("a");
  });
});
