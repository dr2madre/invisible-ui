import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import {
  firstVisible,
  initialState,
  lastVisible,
  nextVisible,
  parentOf,
  prevVisible,
  toggleExpanded,
  visibleNodes,
} from "./state";
import type { TreeNode } from "./types";

const nodes: TreeNode[] = [
  {
    value: "src",
    children: [
      { value: "index.ts" },
      { value: "lib", children: [{ value: "button.ts" }, { value: "input.ts" }] },
    ],
  },
  { value: "readme", disabled: true },
  { value: "package.json" },
];

const make = (overrides = {}) => initialState({ id: "x", nodes, ...overrides });

describe("tree state — visible flattening", () => {
  it("hides collapsed subtrees", () => {
    const visible = visibleNodes(make()).map((n) => n.value);
    expect(visible).toEqual(["src", "readme", "package.json"]);
  });

  it("reveals children of expanded parents in DOM order", () => {
    const visible = visibleNodes(make({ expanded: ["src"] })).map((n) => n.value);
    expect(visible).toEqual(["src", "index.ts", "lib", "readme", "package.json"]);
  });

  it("reveals nested grandchildren when both ancestors are expanded", () => {
    const visible = visibleNodes(make({ expanded: ["src", "lib"] })).map((n) => n.value);
    expect(visible).toEqual([
      "src",
      "index.ts",
      "lib",
      "button.ts",
      "input.ts",
      "readme",
      "package.json",
    ]);
  });

  it("annotates level, setSize, posInSet and parent", () => {
    const map = new Map(visibleNodes(make({ expanded: ["src"] })).map((n) => [n.value, n]));
    expect(map.get("src")).toMatchObject({
      level: 1,
      posInSet: 1,
      setSize: 3,
      parent: null,
      hasChildren: true,
    });
    expect(map.get("lib")).toMatchObject({
      level: 2,
      posInSet: 2,
      setSize: 2,
      parent: "src",
      hasChildren: true,
    });
    expect(map.get("index.ts")).toMatchObject({
      level: 2,
      posInSet: 1,
      parent: "src",
      hasChildren: false,
    });
  });
});

describe("tree state — navigation (skips disabled, no wrap)", () => {
  it("first/last over visible enabled nodes", () => {
    const s = make({ expanded: ["src"] });
    expect(firstVisible(s)).toBe("src");
    // `readme` is disabled, so the last enabled visible node is package.json.
    expect(lastVisible(s)).toBe("package.json");
  });

  it("next/prev step through the visible list and skip disabled", () => {
    const s = make({ expanded: ["src"] });
    expect(nextVisible(s, "lib")).toBe("package.json"); // hops over disabled `readme`
    expect(prevVisible(s, "package.json")).toBe("lib");
    expect(nextVisible(s, "package.json")).toBeNull(); // no wrap at the end
    expect(prevVisible(s, "src")).toBeNull(); // no wrap at the start
  });

  it("parentOf returns the enclosing node, null at root", () => {
    const s = make({ expanded: ["src", "lib"] });
    expect(parentOf(s, "button.ts")).toBe("lib");
    expect(parentOf(s, "lib")).toBe("src");
    expect(parentOf(s, "src")).toBeNull();
  });

  it("toggleExpanded adds and removes", () => {
    expect(toggleExpanded(make(), "src")).toEqual(["src"]);
    expect(toggleExpanded(make({ expanded: ["src"] }), "src")).toEqual([]);
  });
});

describe("tree connect", () => {
  const keyEvent = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as Event;

  const wire = (overrides = {}) => {
    const setExpanded = vi.fn();
    const setSelected = vi.fn();
    const setFocused = vi.fn();
    const focus = vi.fn();
    const api = connect({ state: make(overrides), setExpanded, setSelected, setFocused, focus });
    return { api, setExpanded, setSelected, setFocused, focus };
  };

  it("exposes the WAI-ARIA tree roles and metadata", () => {
    const { api } = wire({ expanded: ["src"], selected: "index.ts" });
    expect(api.rootProps.role).toBe("tree");
    expect(api.getGroupProps().role).toBe("group");
    const src = api.getItemProps("src");
    expect(src.role).toBe("treeitem");
    expect(src["aria-expanded"]).toBe(true);
    expect(src["aria-level"]).toBe(1);
    const selected = api.getItemProps("index.ts");
    expect(selected["aria-selected"]).toBe(true);
    expect(selected["aria-expanded"]).toBeUndefined(); // a leaf is not expandable
  });

  it("gives leaves no aria-expanded and a single roving tab stop", () => {
    const { api } = wire({ selected: "package.json" });
    expect(api.getItemProps("package.json").tabindex).toBe(0); // selected → tab stop
    expect(api.getItemProps("src").tabindex).toBe(-1);
  });

  it("ArrowRight expands a collapsed parent", () => {
    const { api, setExpanded } = wire();
    (api.getItemProps("src").onKeyDown as (e: Event) => void)(keyEvent("ArrowRight"));
    expect(setExpanded).toHaveBeenCalledWith(["src"]);
  });

  it("ArrowRight on an expanded parent moves focus to the first child", () => {
    const { api, focus } = wire({ expanded: ["src"] });
    (api.getItemProps("src").onKeyDown as (e: Event) => void)(keyEvent("ArrowRight"));
    expect(focus).toHaveBeenCalledWith("index.ts");
  });

  it("ArrowLeft collapses an expanded parent, else rises to the parent", () => {
    const collapse = wire({ expanded: ["src"] });
    (collapse.api.getItemProps("src").onKeyDown as (e: Event) => void)(keyEvent("ArrowLeft"));
    expect(collapse.setExpanded).toHaveBeenCalledWith([]);

    const rise = wire({ expanded: ["src"] });
    (rise.api.getItemProps("index.ts").onKeyDown as (e: Event) => void)(keyEvent("ArrowLeft"));
    expect(rise.focus).toHaveBeenCalledWith("src");
  });

  it("Enter/Space select; disabled nodes never select", () => {
    const enter = wire({ expanded: ["src"] });
    (enter.api.getItemProps("lib").onKeyDown as (e: Event) => void)(keyEvent("Enter"));
    expect(enter.setSelected).toHaveBeenCalledWith("lib");

    const disabled = wire();
    disabled.api.select("readme");
    expect(disabled.setSelected).not.toHaveBeenCalled();
  });
});
