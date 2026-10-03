import { afterEach, describe, expect, it, vi } from "vitest";
import { connect, type ConnectOptions } from "./connect";
import { initialState, isStopDisabled, isSubmenu, itemsOf } from "./state";
import { checkItems, entriesAt, findEntry, resolveOpenPath } from "./tree";
import type { MenuEntry, MenuState, MenuSubmenu } from "./types";

const tree: MenuEntry[] = [
  { value: "new", label: "New file" },
  {
    type: "submenu",
    value: "share",
    label: "Share",
    items: [
      { value: "mail", label: "Mail" },
      { value: "link", label: "Copy link" },
      {
        type: "submenu",
        value: "social",
        label: "Social",
        items: [{ value: "post", label: "Post" }],
      },
    ],
  },
  {
    type: "group",
    label: "View",
    items: [
      {
        type: "submenu",
        value: "zoom",
        label: "Zoom",
        items: [
          {
            type: "group",
            label: "Level",
            items: [
              { value: "z100", label: "100%", kind: "radio", checked: true },
              { value: "z200", label: "200%", kind: "radio" },
            ],
          },
        ],
      },
    ],
  },
  { type: "submenu", value: "off", label: "Off", disabled: true, items: [{ value: "x" }] },
];

/** A menu wired to plain state, re-connected after every change. */
const harness = (over: Partial<MenuState> = {}, options: Partial<ConnectOptions> = {}) => {
  let state: MenuState = { ...initialState({ items: tree, id: "m" }), open: true, ...over };
  const calls: string[] = [];
  const onSelect = vi.fn((value: string) => calls.push(`select:${value}:${state.open}`));
  const setOpen = vi.fn((open: boolean) => {
    calls.push(`open:${open}`);
    state = { ...state, open };
  });
  const setOpenPath = vi.fn((openPath: string[]) => (state = { ...state, openPath }));
  const api = () =>
    connect({
      state,
      setOpen,
      setActiveValue: (activeValue) => (state = { ...state, activeValue }),
      setOpenPath,
      onSelect,
      ...options,
    });
  return { api, onSelect, setOpen, setOpenPath, calls, state: () => state };
};

const key = (k: string) => ({ key: k, preventDefault: vi.fn() });
const press = (api: ReturnType<typeof connect>, k: string) => {
  const event = key(k);
  (api.menuProps.onKeyDown as (e: unknown) => void)(event);
  return event;
};

afterEach(() => vi.restoreAllMocks());

describe("submenu model", () => {
  it("keeps a trigger as a stop of its level and leaves its children out", () => {
    expect(itemsOf(tree).map((stop) => stop.value)).toEqual(["new", "share", "zoom", "off"]);
  });

  it("tells a submenu apart from the other entries", () => {
    expect(isSubmenu(tree[1]!)).toBe(true);
    expect(isSubmenu(tree[0]!)).toBe(false);
    expect(isSubmenu({ type: "separator" })).toBe(false);
  });

  it("keeps existing data valid", () => {
    const plain: MenuEntry[] = [{ value: "a" }, { type: "separator" }, { value: "b" }];
    expect(itemsOf(plain).map((stop) => stop.value)).toEqual(["a", "b"]);
    expect(() => checkItems(plain)).not.toThrow();
  });

  it("finds an entry anywhere in the tree, with the path that leads to it", () => {
    expect(findEntry(tree, "post")?.path).toEqual(["share", "social"]);
    expect(findEntry(tree, "z200")?.path).toEqual(["zoom"]);
    expect(findEntry(tree, "new")?.path).toEqual([]);
    expect(findEntry(tree, "nope")).toBeNull();
  });

  it("gives the entries of the level a path opens", () => {
    expect(itemsOf(entriesAt(tree, ["share", "social"])).map((s) => s.value)).toEqual(["post"]);
    expect(entriesAt(tree, [])).toBe(tree);
    expect(entriesAt(tree, ["new"])).toEqual([]);
  });

  it("treats a submenu with no enabled item as disabled", () => {
    const empty: MenuSubmenu = { type: "submenu", value: "e", label: "E", items: [] };
    const allOff: MenuSubmenu = {
      type: "submenu",
      value: "o",
      label: "O",
      items: [{ value: "a", disabled: true }, { type: "separator" }],
    };
    const onlyEmpty: MenuSubmenu = { type: "submenu", value: "n", label: "N", items: [empty] };
    expect(isStopDisabled(empty)).toBe(true);
    expect(isStopDisabled(allOff)).toBe(true);
    expect(isStopDisabled(onlyEmpty)).toBe(true);
    expect(isStopDisabled(tree[1] as MenuSubmenu)).toBe(false);
  });

  it("throws in development on a value used twice across levels", () => {
    const repeated: MenuEntry[] = [
      { value: "copy" },
      { type: "submenu", value: "more", label: "More", items: [{ value: "copy" }] },
    ];
    expect(() => checkItems(repeated)).toThrow(/"copy" appears more than once/);
    const twice: MenuEntry[] = [{ value: "a" }, { value: "a" }];
    const wire = () =>
      connect({
        state: initialState({ items: twice }),
        setOpen: () => {},
        setActiveValue: () => {},
      });
    expect(wire).toThrow();
    expect(wire).toThrow(); // every time, until the data is fixed
  });

  it("throws on a submenu value that repeats an item value", () => {
    const repeated: MenuEntry[] = [
      { value: "more" },
      { type: "submenu", value: "more", label: "More", items: [{ value: "a" }] },
    ];
    expect(() => checkItems(repeated)).toThrow(/"more"/);
  });

  it("warns once about a submenu more than two levels below the root", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const level = (value: string, items: MenuEntry[]): MenuSubmenu => ({
      type: "submenu",
      value,
      label: value,
      items,
    });
    const twoLevels = [level("one", [level("two", [{ value: "leaf2" }])])];
    checkItems(twoLevels);
    expect(warn).not.toHaveBeenCalled();

    const threeLevels = [level("a", [level("b", [level("c", [{ value: "leaf" }])])])];
    checkItems(threeLevels);
    checkItems(threeLevels);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/"c"/);
  });

  it("cuts an open path at a value that is gone, disabled or not a submenu", () => {
    expect(resolveOpenPath(tree, ["share", "social"])).toEqual(["share", "social"]);
    expect(resolveOpenPath(tree, ["share", "gone", "x"])).toEqual(["share"]);
    expect(resolveOpenPath(tree, ["off"])).toEqual([]);
    expect(resolveOpenPath(tree, ["new"])).toEqual([]);
  });
});

describe("submenu props", () => {
  it("marks a trigger as opening a menu, expanded only while open", () => {
    const closed = harness().api().getSubmenuTriggerProps("share");
    expect(closed.role).toBe("menuitem");
    expect(closed["aria-haspopup"]).toBe("menu");
    expect(closed["aria-expanded"]).toBe(false);
    expect(closed["aria-controls"]).toBeUndefined();
    expect(closed["data-state"]).toBe("closed");
    expect(closed["data-kind"]).toBe("submenu");

    const open = harness({ openPath: ["share"] })
      .api()
      .getSubmenuTriggerProps("share");
    expect(open["aria-expanded"]).toBe(true);
    expect(open["aria-controls"]).toBe("m-submenu-share");
    expect(open["data-state"]).toBe("open");
  });

  it("gives a trigger its submenu props through getItemProps too", () => {
    const api = harness().api();
    const attributes = (props: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(props).filter(([, v]) => typeof v !== "function"));
    expect(attributes(api.getItemProps("share"))).toEqual(
      attributes(api.getSubmenuTriggerProps("share")),
    );
    expect(api.getItemProps("share")["aria-haspopup"]).toBe("menu");
  });

  it("marks a disabled trigger", () => {
    const off = harness().api().getSubmenuTriggerProps("off");
    expect(off["aria-disabled"]).toBe(true);
    expect(off["data-disabled"]).toBe("");
  });

  it("labels a submenu by its trigger and says its level", () => {
    const api = harness({ openPath: ["share", "social"] }).api();
    const share = api.getSubmenuProps("share");
    expect(share.role).toBe("menu");
    expect(share.id).toBe(api.getSubmenuTriggerProps("share")["aria-controls"]);
    expect(share["aria-labelledby"]).toBe(api.getSubmenuTriggerProps("share").id);
    expect(share["data-level"]).toBe(1);
    expect(api.getSubmenuProps("social")["data-level"]).toBe(2);
    expect(api.menuProps["data-level"]).toBe(0);
    expect(share["data-state"]).toBe("open");
  });

  it("names groups inside a submenu without clashing with root groups", () => {
    const api = harness().api();
    expect(api.getGroupLabelProps(0).id).not.toBe(api.getGroupLabelProps(0, "zoom").id);
    expect(api.getGroupProps(0, "zoom")["aria-labelledby"]).toBe(
      api.getGroupLabelProps(0, "zoom").id,
    );
  });

  it("gives items inside a submenu their roles and checked state", () => {
    const api = harness({ openPath: ["zoom"] }).api();
    expect(api.getItemProps("z100").role).toBe("menuitemradio");
    expect(api.getItemProps("z100")["aria-checked"]).toBe(true);
  });
});

describe("submenu state", () => {
  it("opens a submenu with its path, one per level", () => {
    const h = harness();
    h.api().openSubmenu("social", "first");
    expect(h.api().openPath).toEqual(["share", "social"]);
    expect(h.api().activeValue).toBe("post");

    // Opening a sibling closes the other submenu of that level and its descendants.
    h.api().openSubmenu("zoom", "first");
    expect(h.api().openPath).toEqual(["zoom"]);
    expect(h.api().activeValue).toBe("z100");
  });

  it("opens on hover without moving focus", () => {
    const h = harness({ activeValue: "share" });
    h.api().openSubmenu("share", "none");
    expect(h.api().openPath).toEqual(["share"]);
    expect(h.api().activeValue).toBe("share");
  });

  it("refuses a disabled or empty submenu, a plain item and a closed menu", () => {
    const h = harness();
    h.api().openSubmenu("off");
    h.api().openSubmenu("new");
    expect(h.setOpenPath).not.toHaveBeenCalled();

    const closed = harness({ open: false });
    closed.api().openSubmenu("share");
    expect(closed.setOpenPath).not.toHaveBeenCalled();
  });

  it("closes the deepest level and focuses its trigger", () => {
    const h = harness({ openPath: ["share", "social"], activeValue: "post" });
    h.api().closeSubmenu();
    expect(h.api().openPath).toEqual(["share"]);
    expect(h.api().activeValue).toBe("social");
  });

  it("reports the level of a value", () => {
    const api = harness().api();
    expect(api.levelOf("new")).toBe(0);
    expect(api.levelOf("mail")).toBe(1);
    expect(api.levelOf("post")).toBe(2);
    expect(api.levelOf("nope")).toBe(-1);
    expect(api.findEntry("post")?.path).toEqual(["share", "social"]);
    expect(itemsOf(api.entriesAt(["zoom"])).map((s) => s.value)).toEqual(["z100", "z200"]);
  });

  it("closes every level before reporting, and reports once", () => {
    const h = harness({ openPath: ["share", "social"], activeValue: "post" });
    press(h.api(), "Enter");
    expect(h.calls).toEqual(["open:false", "select:post:false"]);
    expect(h.state().openPath).toEqual([]);
    expect(h.onSelect).toHaveBeenCalledTimes(1);
  });

  it("closes every level before reporting a press on an item in a submenu", () => {
    const h = harness({ openPath: ["share"] });
    (h.api().getItemProps("mail").onClick as () => void)();
    expect(h.calls).toEqual(["open:false", "select:mail:false"]);
  });

  it("never reports a submenu trigger", () => {
    const h = harness();
    h.api().select("share");
    press(h.api(), "Enter");
    (h.api().getSubmenuTriggerProps("share").onClick as () => void)();
    expect(h.onSelect).not.toHaveBeenCalled();
  });

  it("reports the root menu only: submenus never change the open state", () => {
    const h = harness({ activeValue: "share" });
    press(h.api(), "ArrowRight");
    press(h.api(), "ArrowRight");
    press(h.api(), "Escape");
    press(h.api(), "ArrowLeft");
    expect(h.setOpen).not.toHaveBeenCalled();
    press(h.api(), "Escape");
    expect(h.setOpen).toHaveBeenCalledTimes(1);
    expect(h.setOpen).toHaveBeenCalledWith(false);
  });

  it("clears the open path when the menu opens and closes", () => {
    const h = harness({ open: false, openPath: ["share"] });
    expect(h.api().openPath).toEqual([]);
    h.api().openMenu();
    expect(h.state().openPath).toEqual([]);

    h.api().openSubmenu("share");
    h.api().closeMenu();
    expect(h.state().openPath).toEqual([]);
  });

  it("works without a setOpenPath: submenus simply stay closed", () => {
    const h = harness({ activeValue: "share" }, { setOpenPath: undefined });
    expect(() => press(h.api(), "ArrowRight")).not.toThrow();
    expect(h.api().openPath).toEqual([]);
  });
});

describe("submenu trigger press", () => {
  const click = (api: ReturnType<typeof connect>, pointerType?: string) =>
    (api.getSubmenuTriggerProps("share").onClick as (e?: unknown) => void)(
      pointerType ? { pointerType } : undefined,
    );

  it("opens a closed submenu and keeps focus on the trigger", () => {
    const h = harness();
    click(h.api(), "mouse");
    expect(h.api().openPath).toEqual(["share"]);
    expect(h.api().activeValue).toBe("share");
  });

  it("keeps an open submenu open on a mouse press", () => {
    const h = harness({ openPath: ["share"] });
    click(h.api(), "mouse");
    click(h.api());
    expect(h.api().openPath).toEqual(["share"]);
  });

  it("closes an open submenu on a touch or pen press", () => {
    for (const pointer of ["touch", "pen"]) {
      const h = harness({ openPath: ["share", "social"] });
      click(h.api(), pointer);
      expect(h.api().openPath).toEqual([]);
      expect(h.api().activeValue).toBe("share");
    }
  });

  it("does nothing on a disabled trigger, by press or hover", () => {
    const h = harness();
    const props = h.api().getSubmenuTriggerProps("off");
    (props.onClick as (e: unknown) => void)({ pointerType: "touch" });
    (props.onMouseEnter as () => void)();
    expect(h.setOpenPath).not.toHaveBeenCalled();
    expect(h.api().activeValue).toBeNull();
  });
});

describe("submenu keys", () => {
  it("leaves the two unhandled arrows to a menubar", () => {
    const plain = harness({ activeValue: "new" });
    expect(press(plain.api(), "ArrowRight").preventDefault).not.toHaveBeenCalled();
    expect(press(plain.api(), "ArrowLeft").preventDefault).not.toHaveBeenCalled();

    const rtl = harness({ activeValue: "new" }, { direction: "rtl" });
    expect(press(rtl.api(), "ArrowLeft").preventDefault).not.toHaveBeenCalled();
    expect(press(rtl.api(), "ArrowRight").preventDefault).not.toHaveBeenCalled();
  });

  it("mirrors open and close under right-to-left", () => {
    const h = harness({ activeValue: "share" }, { direction: "rtl" });
    press(h.api(), "ArrowRight");
    expect(h.api().openPath).toEqual([]);
    press(h.api(), "ArrowLeft");
    expect(h.api().openPath).toEqual(["share"]);
    expect(h.api().activeValue).toBe("mail");
    press(h.api(), "ArrowRight");
    expect(h.api().openPath).toEqual([]);
    expect(h.api().activeValue).toBe("share");
  });

  it("keeps a checkable menu open on Space and reports each change once", () => {
    const h = harness({ openPath: ["zoom"], activeValue: "z200" });
    press(h.api(), " ");
    expect(h.onSelect).toHaveBeenCalledTimes(1);
    expect(h.onSelect).toHaveBeenCalledWith("z200");
    expect(h.setOpen).not.toHaveBeenCalled();
    expect(h.api().openPath).toEqual(["zoom"]);

    press(h.api(), "ArrowUp");
    press(h.api(), " ");
    expect(h.onSelect).toHaveBeenLastCalledWith("z100");
    expect(h.onSelect).toHaveBeenCalledTimes(2);
  });

  it("closes a checkable menu on Enter and on a press", () => {
    const enter = harness({ openPath: ["zoom"], activeValue: "z200" });
    press(enter.api(), "Enter");
    expect(enter.calls).toEqual(["open:false", "select:z200:false"]);

    const click = harness({ openPath: ["zoom"] });
    (click.api().getItemProps("z200").onClick as () => void)();
    expect(click.calls).toEqual(["open:false", "select:z200:false"]);
  });

  it("does not report Space on a disabled checkable item", () => {
    const items: MenuEntry[] = [{ value: "a", kind: "checkbox", disabled: true }, { value: "b" }];
    let state: MenuState = { ...initialState({ items, id: "d" }), open: true, activeValue: "a" };
    const onSelect = vi.fn();
    const api = connect({
      state,
      setOpen: (open) => (state = { ...state, open }),
      setActiveValue: () => {},
      onSelect,
    });
    press(api, " ");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
