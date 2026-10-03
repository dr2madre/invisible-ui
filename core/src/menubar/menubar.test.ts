import { describe, expect, it, vi } from "vitest";
import { menu } from "../index";
import { connect, type ConnectOptions } from "./connect";
import type { MenubarState } from "./types";

const menus = [{ value: "file" }, { value: "edit" }, { value: "view", disabled: true }];

/** A bar wired to plain state, logging what it asks the adapter to do. */
const harness = (over: Partial<MenubarState> = {}, options: Partial<ConnectOptions> = {}) => {
  let state: MenubarState = { menus, focusedIndex: 0, openIndex: -1, ...over };
  const log: string[] = [];
  const api = () =>
    connect({
      state,
      setFocusedIndex: (focusedIndex) => (state = { ...state, focusedIndex }),
      openMenu: (index) => {
        log.push(`open:${index}`);
        state = { ...state, openIndex: index };
      },
      closeMenu: (index) => {
        log.push(`close:${index}`);
        state = { ...state, openIndex: -1 };
      },
      focusTrigger: (index) => log.push(`focus:${index}`),
      ...options,
    });
  return { api, log, state: () => state };
};

const key = (k: string, defaultPrevented = false) => ({
  key: k,
  defaultPrevented,
  preventDefault: vi.fn(),
});
const press = (api: ReturnType<typeof connect>, k: string, defaultPrevented = false) => {
  const event = key(k, defaultPrevented);
  (api.menubarProps.onKeyDown as (e: unknown) => void)(event);
  return event;
};

describe("menubar", () => {
  it("is a horizontal menubar with one tab stop", () => {
    const api = harness({ focusedIndex: 1 }).api();
    expect(api.menubarProps.role).toBe("menubar");
    expect(api.menubarProps["aria-orientation"]).toBe("horizontal");
    expect(api.getTriggerProps(0).tabindex).toBe(-1);
    expect(api.getTriggerProps(1).tabindex).toBe(0);
    expect(api.getTriggerProps(1).role).toBe("menuitem");
  });

  it("keeps the tab stop on the bar when menus go away", () => {
    const api = harness({ focusedIndex: 5 }).api();
    expect(api.focusedIndex).toBe(2);
    expect(api.getTriggerProps(2).tabindex).toBe(0);
  });

  it("moves focus between triggers while every menu is closed, wrapping", () => {
    const h = harness();
    press(h.api(), "ArrowRight");
    expect(h.state().focusedIndex).toBe(1);
    press(h.api(), "ArrowLeft");
    press(h.api(), "ArrowLeft");
    expect(h.state().focusedIndex).toBe(2);
    expect(h.log).toEqual(["focus:1", "focus:0", "focus:2"]);
  });

  it("switches the open menu with the arrows, one open at a time", () => {
    const h = harness({ openIndex: 0 });
    press(h.api(), "ArrowRight");
    expect(h.log).toEqual(["close:0", "open:1"]);
    expect(h.state()).toMatchObject({ openIndex: 1, focusedIndex: 1 });
  });

  it("focuses a disabled menu's trigger instead of opening it", () => {
    const h = harness({ openIndex: 1, focusedIndex: 1 });
    press(h.api(), "ArrowRight");
    expect(h.log).toEqual(["close:1", "focus:2"]);
    expect(h.state()).toMatchObject({ openIndex: -1, focusedIndex: 2 });
  });

  it("mirrors the arrows under right-to-left", () => {
    const h = harness({}, { direction: "rtl" });
    press(h.api(), "ArrowLeft");
    expect(h.state().focusedIndex).toBe(1);
    press(h.api(), "ArrowRight");
    expect(h.state().focusedIndex).toBe(0);
  });

  it("leaves an arrow the open menu already handled", () => {
    const h = harness({ openIndex: 0 });
    const event = press(h.api(), "ArrowRight", true);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(h.log).toEqual([]);
  });

  it("uses Home and End only while every menu is closed", () => {
    const closed = harness({ focusedIndex: 1 });
    press(closed.api(), "End");
    expect(closed.state().focusedIndex).toBe(2);
    press(closed.api(), "Home");
    expect(closed.state().focusedIndex).toBe(0);

    const open = harness({ openIndex: 0 });
    expect(press(open.api(), "End").preventDefault).not.toHaveBeenCalled();
    expect(open.log).toEqual([]);
  });

  it("switches the open menu on hover only while one is open", () => {
    const closed = harness();
    (closed.api().getTriggerProps(1).onPointerEnter as () => void)();
    expect(closed.log).toEqual([]);

    const open = harness({ openIndex: 0 });
    (open.api().getTriggerProps(1).onPointerEnter as () => void)();
    expect(open.log).toEqual(["close:0", "open:1"]);
  });

  it("follows focus onto a trigger", () => {
    const h = harness();
    (h.api().getTriggerProps(2).onFocus as () => void)();
    expect(h.state().focusedIndex).toBe(2);
  });

  it("does nothing with no menus", () => {
    const h = harness({ menus: [] });
    expect(press(h.api(), "ArrowRight").preventDefault).not.toHaveBeenCalled();
    h.api().move(1);
    expect(h.log).toEqual([]);
  });
});

describe("menubar with submenus", () => {
  // Two top menus; File holds a submenu. Each menu is a core menu machine,
  // and its key handler runs before the bar's, as the DOM bubbles.
  const fileItems: menu.MenuEntry[] = [
    { value: "new", label: "New" },
    { type: "submenu", value: "recent", label: "Recent", items: [{ value: "a", label: "A" }] },
  ];
  const editItems: menu.MenuEntry[] = [{ value: "undo", label: "Undo" }];

  const setup = (direction: "ltr" | "rtl" = "ltr") => {
    const menuStates: menu.MenuState[] = [
      { ...menu.initialState({ items: fileItems, id: "f" }), open: true },
      menu.initialState({ items: editItems, id: "e" }),
    ];
    let bar: MenubarState = {
      menus: [{ value: "file" }, { value: "edit" }],
      focusedIndex: 0,
      openIndex: 0,
    };
    const menuApi = (i: number) =>
      menu.connect({
        state: menuStates[i]!,
        setOpen: (open) => (menuStates[i] = { ...menuStates[i]!, open }),
        setActiveValue: (activeValue) => (menuStates[i] = { ...menuStates[i]!, activeValue }),
        setOpenPath: (openPath) => (menuStates[i] = { ...menuStates[i]!, openPath }),
        direction,
      });
    const barApi = () =>
      connect({
        state: bar,
        setFocusedIndex: (focusedIndex) => (bar = { ...bar, focusedIndex }),
        openMenu: (i) => {
          menuApi(i).openMenu("first");
          bar = { ...bar, openIndex: i };
        },
        closeMenu: (i) => {
          menuApi(i).closeMenu();
          bar = { ...bar, openIndex: -1 };
        },
        focusTrigger: () => {},
        direction,
      });
    const keydown = (k: string) => {
      let prevented = false;
      const event = {
        key: k,
        get defaultPrevented() {
          return prevented;
        },
        preventDefault: () => (prevented = true),
      };
      const open = bar.openIndex;
      if (open !== -1) (menuApi(open).menuProps.onKeyDown as (e: unknown) => void)(event);
      (barApi().menubarProps.onKeyDown as (e: unknown) => void)(event);
    };
    return {
      keydown,
      menuStates,
      bar: () => bar,
      setActive: (v: string) => menuApi(0).setActive(v),
    };
  };

  it("opens a submenu with the arrow toward inline-end on its trigger", () => {
    const s = setup();
    s.setActive("recent");
    s.keydown("ArrowRight");
    expect(s.menuStates[0]).toMatchObject({ openPath: ["recent"], activeValue: "a" });
    expect(s.bar().openIndex).toBe(0);
  });

  it("moves to the next top menu from a plain item, closing every level", () => {
    const s = setup();
    s.setActive("recent");
    s.keydown("ArrowRight"); // into the submenu
    s.keydown("ArrowRight"); // "a" is a plain item: next top menu
    expect(s.menuStates[0]).toMatchObject({ open: false, openPath: [] });
    expect(s.menuStates[1]).toMatchObject({ open: true, activeValue: "undo" });
    expect(s.bar().openIndex).toBe(1);
  });

  it("closes a submenu with the arrow toward inline-start, then moves top menus from the root", () => {
    const s = setup();
    s.setActive("recent");
    s.keydown("ArrowRight");
    s.keydown("ArrowLeft");
    expect(s.menuStates[0]).toMatchObject({ open: true, openPath: [], activeValue: "recent" });
    expect(s.bar().openIndex).toBe(0);
    s.keydown("ArrowLeft"); // root menu: previous top menu, wrapping
    expect(s.bar().openIndex).toBe(1);
  });

  it("mirrors the whole rule under right-to-left", () => {
    const s = setup("rtl");
    s.setActive("recent");
    s.keydown("ArrowLeft");
    expect(s.menuStates[0]).toMatchObject({ openPath: ["recent"] });
    s.keydown("ArrowLeft"); // plain item: next top menu, which is on the left
    expect(s.bar().openIndex).toBe(1);
  });
});
