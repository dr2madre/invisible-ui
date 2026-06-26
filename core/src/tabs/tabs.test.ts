import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";
import type { TabItem } from "./types";

const items: TabItem[] = [{ value: "one" }, { value: "two", disabled: true }, { value: "three" }];

const make = (overrides = {}) => initialState({ id: "t", items, value: "one", ...overrides });

describe("tabs state", () => {
  it("defaults the value to the first enabled tab", () => {
    expect(initialState({ id: "t", items }).value).toBe("one");
  });

  it("defaults orientation to horizontal and activation to automatic", () => {
    const state = initialState({ id: "t", items });
    expect(state.orientation).toBe("horizontal");
    expect(state.activationMode).toBe("automatic");
  });
});

describe("tabs connect", () => {
  const noop = () => {};

  it("exposes a tablist and linked tab/panel ids", () => {
    const api = connect({ state: make(), setValue: noop });
    expect(api.rootProps.role).toBe("tablist");

    const tab = api.getTabProps("one");
    const panel = api.getPanelProps("one");
    expect(tab.role).toBe("tab");
    expect(tab.id).toBe("t-tab-one");
    expect(tab["aria-controls"]).toBe("t-panel-one");
    expect(panel.role).toBe("tabpanel");
    expect(panel.id).toBe("t-panel-one");
    expect(panel["aria-labelledby"]).toBe("t-tab-one");
  });

  it("marks the selected tab and hides inactive panels", () => {
    const api = connect({ state: make({ value: "one" }), setValue: noop });
    expect(api.getTabProps("one")["aria-selected"]).toBe(true);
    expect(api.getTabProps("one").tabindex).toBe(0);
    expect(api.getTabProps("three")["aria-selected"]).toBe(false);
    expect(api.getTabProps("three").tabindex).toBe(-1);

    expect(api.getPanelProps("one").hidden).toBe(false);
    expect(api.getPanelProps("three").hidden).toBe(true);
  });

  it("selects on click but ignores disabled tabs", () => {
    const setValue = vi.fn();
    const api = connect({ state: make(), setValue });
    (api.getTabProps("three").onClick as () => void)();
    expect(setValue).toHaveBeenCalledWith("three");

    setValue.mockClear();
    (api.getTabProps("two").onClick as () => void)(); // disabled
    expect(setValue).not.toHaveBeenCalled();
  });

  const keyEvent = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as Event;

  it("automatic mode: ArrowRight focuses and selects the next enabled tab", () => {
    const setValue = vi.fn();
    const focus = vi.fn();
    const api = connect({ state: make({ value: "one" }), setValue, focus });
    (api.getTabProps("one").onKeyDown as (e: Event) => void)(keyEvent("ArrowRight"));
    expect(focus).toHaveBeenCalledWith("three"); // skips disabled "two"
    expect(setValue).toHaveBeenCalledWith("three");
  });

  it("manual mode: ArrowRight focuses only; Enter selects", () => {
    const setValue = vi.fn();
    const focus = vi.fn();
    const api = connect({
      state: make({ value: "one", activationMode: "manual" }),
      setValue,
      focus,
    });
    const tab = api.getTabProps("one");
    (tab.onKeyDown as (e: Event) => void)(keyEvent("ArrowRight"));
    expect(focus).toHaveBeenCalledWith("three");
    expect(setValue).not.toHaveBeenCalled();

    (api.getTabProps("three").onKeyDown as (e: Event) => void)(keyEvent("Enter"));
    expect(setValue).toHaveBeenCalledWith("three");
  });

  it("uses vertical arrow keys when vertical", () => {
    const focus = vi.fn();
    const api = connect({ state: make({ orientation: "vertical" }), setValue: noop, focus });
    (api.getTabProps("one").onKeyDown as (e: Event) => void)(keyEvent("ArrowDown"));
    expect(focus).toHaveBeenCalledWith("three");
  });
});
