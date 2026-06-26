import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { canGoNext, canGoPrev, clampIndex, initialState, nextIndex, prevIndex } from "./state";

const make = (overrides = {}) => initialState({ id: "x", count: 3, ...overrides });

describe("carousel state", () => {
  it("defaults to index 0, no loop, horizontal", () => {
    const s = make();
    expect(s.index).toBe(0);
    expect(s.loop).toBe(false);
    expect(s.orientation).toBe("horizontal");
  });

  it("clamps the initial index", () => {
    expect(make({ index: 9 }).index).toBe(2);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(2, 0)).toBe(0);
  });

  it("steps forward/back and stops at the ends without loop", () => {
    expect(nextIndex(make({ index: 0 }))).toBe(1);
    expect(nextIndex(make({ index: 2 }))).toBe(2); // clamped at last
    expect(prevIndex(make({ index: 0 }))).toBe(0); // clamped at first
  });

  it("wraps around the ends with loop", () => {
    expect(nextIndex(make({ index: 2, loop: true }))).toBe(0);
    expect(prevIndex(make({ index: 0, loop: true }))).toBe(2);
  });

  it("reports reachability at the ends", () => {
    expect(canGoPrev(make({ index: 0 }))).toBe(false);
    expect(canGoNext(make({ index: 2 }))).toBe(false);
    expect(canGoPrev(make({ index: 0, loop: true }))).toBe(true);
    expect(canGoNext(make({ index: 2, loop: true }))).toBe(true);
  });
});

describe("carousel connect", () => {
  const wire = (overrides = {}) => {
    const setIndex = vi.fn();
    return { api: connect({ state: make(overrides), setIndex }), setIndex };
  };
  const keyEvent = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as Event;

  it("labels the container as a carousel and names each slide 'N of M'", () => {
    const { api } = wire({ index: 1 });
    expect(api.rootProps.role).toBe("group");
    expect(api.rootProps["aria-roledescription"]).toBe("carousel");
    const slide = api.getSlideProps(0);
    expect(slide["aria-roledescription"]).toBe("slide");
    expect(slide["aria-label"]).toBe("1 of 3");
    expect(api.getSlideProps(1)["data-active"]).toBe("");
  });

  it("disables prev/next at the ends without loop", () => {
    const start = wire({ index: 0 });
    expect(start.api.getPrevProps().disabled).toBe(true);
    expect(start.api.getNextProps().disabled).toBeUndefined();

    const end = wire({ index: 2 });
    expect(end.api.getNextProps().disabled).toBe(true);
  });

  it("next/prev/goTo request the new index", () => {
    const n = wire({ index: 0 });
    (n.api.getNextProps().onClick as () => void)();
    expect(n.setIndex).toHaveBeenCalledWith(1);

    const g = wire({ index: 0 });
    (g.api.getIndicatorProps(2).onClick as () => void)();
    expect(g.setIndex).toHaveBeenCalledWith(2);
  });

  it("marks the current indicator with aria-current", () => {
    const { api } = wire({ index: 1 });
    expect(api.getIndicatorProps(1)["aria-current"]).toBe("true");
    expect(api.getIndicatorProps(0)["aria-current"]).toBeUndefined();
  });

  it("arrow keys on the container move between slides", () => {
    const { api, setIndex } = wire({ index: 1 });
    (api.rootProps.onKeyDown as (e: Event) => void)(keyEvent("ArrowRight"));
    expect(setIndex).toHaveBeenCalledWith(2);
    (api.rootProps.onKeyDown as (e: Event) => void)(keyEvent("ArrowLeft"));
    expect(setIndex).toHaveBeenCalledWith(0);
  });
});
