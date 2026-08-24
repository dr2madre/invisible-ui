import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { clampPage, initialState, pageItems } from "./state";

const make = (overrides = {}) => initialState({ id: "p", pageCount: 20, ...overrides });

describe("pagination state", () => {
  it("clamps the initial page into range", () => {
    expect(make({ page: 0 }).page).toBe(1);
    expect(make({ page: 99 }).page).toBe(20);
    expect(clampPage(5, 10)).toBe(5);
  });

  it("shows all pages when few enough", () => {
    expect(pageItems(make({ pageCount: 5, page: 1 }))).toEqual([1, 2, 3, 4, 5]);
  });

  it("inserts ellipsis around the current page in long ranges", () => {
    expect(pageItems(make({ page: 10, pageCount: 20 }))).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      "ellipsis",
      20,
    ]);
  });

  it("keeps a wider window near the start with no leading ellipsis", () => {
    expect(pageItems(make({ page: 2, pageCount: 20 }))).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
  });
});

describe("pagination connect", () => {
  const noop = () => {};

  it("marks the current page and exposes prev/next", () => {
    const api = connect({ state: make({ page: 3 }), setPage: noop });
    expect(api.getPageProps(3)["aria-current"]).toBe("page");
    expect(api.getPageProps(4)["aria-current"]).toBeUndefined();
    expect(api.getPrevProps().disabled).toBeUndefined();
    expect(api.getNextProps().disabled).toBeUndefined();
  });

  it("disables prev on the first page and next on the last", () => {
    expect(connect({ state: make({ page: 1 }), setPage: noop }).getPrevProps().disabled).toBe(true);
    expect(connect({ state: make({ page: 20 }), setPage: noop }).getNextProps().disabled).toBe(
      true,
    );
  });

  it("navigates by clicking, clamped to range", () => {
    const setPage = vi.fn();
    const api = connect({ state: make({ page: 5 }), setPage });
    (api.getPageProps(8).onClick as () => void)();
    expect(setPage).toHaveBeenCalledWith(8);

    setPage.mockClear();
    (api.getNextProps().onClick as () => void)();
    expect(setPage).toHaveBeenCalledWith(6);
  });

  it("clamps a page asked for outside the range", () => {
    const setPage = vi.fn();
    const api = connect({ state: make({ page: 5 }), setPage });
    api.setPage(999);
    expect(setPage).toHaveBeenLastCalledWith(20);
    api.setPage(-3);
    expect(setPage).toHaveBeenLastCalledWith(1);
  });

  it("does not report the page it is already on", () => {
    const setPage = vi.fn();
    connect({ state: make({ page: 5 }), setPage }).setPage(5);
    expect(setPage).not.toHaveBeenCalled();
  });

  it("goes nowhere while disabled", () => {
    const setPage = vi.fn();
    const api = connect({ state: make({ page: 5, disabled: true }), setPage });
    api.setPage(7);
    expect(setPage).not.toHaveBeenCalled();
    expect(api.rootProps["data-disabled"]).toBe("");
  });

  it("puts the single tab stop on the current page", () => {
    const api = connect({ state: make({ page: 5 }), setPage: noop });
    expect(api.getPageProps(5).tabindex).toBe(0);
    expect(api.getPageProps(1).tabindex).toBe(-1);
    expect(api.getPrevProps().tabindex).toBe(-1);
  });

  it("moves focus across controls with arrows", () => {
    const focus = vi.fn();
    const api = connect({ state: make({ page: 1, pageCount: 5 }), setPage: noop, focus });
    (api.getPageProps(1).onKeyDown as (e: Event) => void)({
      key: "ArrowRight",
      preventDefault: vi.fn(),
    } as unknown as Event);
    expect(focus).toHaveBeenCalledWith("2");
  });
});
