// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { calendar, carousel, menubar, pagination, tabs } from "..";
import { directionOf } from "./direction";

/** Dispatch `key` on a real element inside `dir` and call `handler` as its listener. */
function press(dir: "ltr" | "rtl", key: string, handler: (event: Event) => void) {
  document.body.innerHTML = `<div dir="${dir}"><button></button></div>`;
  const el = document.querySelector("button")!;
  el.addEventListener("keydown", handler);
  el.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true }));
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("directionOf", () => {
  it("is ltr without a current target", () => {
    expect(directionOf(new Event("keydown"))).toBe("ltr");
  });
});

describe("arrow keys follow the reading direction when none is given", () => {
  it("tabs", () => {
    const items = [{ value: "a" }, { value: "b" }, { value: "c" }];
    const run = (dir: "ltr" | "rtl", key: string) => {
      const focus = vi.fn();
      const api = tabs.connect({
        state: tabs.initialState({ items, id: "t" }),
        setValue: () => {},
        focus,
      });
      press(dir, key, api.getTabProps("a").onKeyDown as (e: Event) => void);
      return focus.mock.calls[0]?.[0];
    };
    expect(run("ltr", "ArrowRight")).toBe("b");
    expect(run("rtl", "ArrowLeft")).toBe("b");
    expect(run("rtl", "ArrowRight")).toBe("c");
  });

  it("pagination", () => {
    const run = (dir: "ltr" | "rtl", key: string) => {
      const focus = vi.fn();
      const api = pagination.connect({
        state: pagination.initialState({ id: "p", pageCount: 5, page: 3 }),
        setPage: () => {},
        focus,
      });
      press(dir, key, api.getPageProps(3).onKeyDown as (e: Event) => void);
      return focus.mock.calls[0]?.[0];
    };
    expect(run("ltr", "ArrowRight")).toBe("4");
    expect(run("rtl", "ArrowLeft")).toBe("4");
    expect(run("rtl", "ArrowRight")).toBe("2");
  });

  it("carousel", () => {
    const run = (dir: "ltr" | "rtl", key: string) => {
      const setIndex = vi.fn();
      const api = carousel.connect({
        state: carousel.initialState({ id: "c", count: 3, index: 1 }),
        setIndex,
      });
      press(dir, key, api.rootProps.onKeyDown as (e: Event) => void);
      return setIndex.mock.calls[0]?.[0];
    };
    expect(run("ltr", "ArrowRight")).toBe(2);
    expect(run("rtl", "ArrowLeft")).toBe(2);
    expect(run("rtl", "ArrowRight")).toBe(0);
  });

  it("calendar", () => {
    const run = (dir: "ltr" | "rtl", key: string) => {
      const setFocus = vi.fn();
      const api = calendar.connect({
        state: calendar.initialState({ focusedDate: "2024-06-12", value: null }),
        setValue: () => {},
        setFocus,
        setView: () => {},
      });
      press(dir, key, api.getDayProps("2024-06-12").onKeyDown as (e: Event) => void);
      return setFocus.mock.calls[0]?.[0];
    };
    expect(run("ltr", "ArrowRight")).toBe("2024-06-13");
    expect(run("rtl", "ArrowLeft")).toBe("2024-06-13");
    expect(run("rtl", "ArrowRight")).toBe("2024-06-11");
  });

  it("menubar", () => {
    const run = (dir: "ltr" | "rtl", key: string) => {
      const setFocusedIndex = vi.fn();
      const api = menubar.connect({
        state: {
          menus: [{ value: "a" }, { value: "b" }, { value: "c" }],
          focusedIndex: 1,
          openIndex: -1,
        },
        setFocusedIndex,
        openMenu: () => {},
        closeMenu: () => {},
        focusTrigger: () => {},
      });
      press(dir, key, api.menubarProps.onKeyDown as (e: Event) => void);
      return setFocusedIndex.mock.calls[0]?.[0];
    };
    expect(run("ltr", "ArrowRight")).toBe(2);
    expect(run("rtl", "ArrowLeft")).toBe(2);
    expect(run("rtl", "ArrowRight")).toBe(0);
  });
});
