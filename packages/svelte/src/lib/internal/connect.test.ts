import type { ElementProps } from "@design-system/core";
import { describe, expect, it, vi } from "vitest";
import { get, writable } from "svelte/store";
import { createNavigationMenu } from "../navigation-menu/create-navigation-menu";
import { createTabs } from "../tabs/create-tabs";
import { createItemAction } from "./connect";

describe("createItemAction", () => {
  it("applies the props of the new item when the parameter changes", () => {
    const api = writable({
      getProps: (id: string): ElementProps => ({ id: `item-${id}`, "data-value": id }),
    });
    const action = createItemAction(api, (a, id: string) => a.getProps(id));
    const node = document.createElement("div");

    const handle = action(node, "a");
    expect(node.id).toBe("item-a");

    handle.update("b");
    expect(node.id).toBe("item-b");
    expect(node.getAttribute("data-value")).toBe("b");
    handle.destroy();
  });

  it("keeps following the store with the new parameter", () => {
    const api = writable({ suffix: "1" });
    const action = createItemAction(api, (a, id: string) => ({ id: `${id}-${a.suffix}` }));
    const node = document.createElement("div");

    const handle = action(node, "a");
    handle.update("b");
    api.set({ suffix: "2" });
    expect(node.id).toBe("b-2");
    handle.destroy();
  });

  it("removes attributes the new item does not set", () => {
    const api = writable({
      getProps: (id: string): ElementProps =>
        id === "a" ? { id, "aria-controls": "panel-a" } : { id },
    });
    const action = createItemAction(api, (a, id: string) => a.getProps(id));
    const node = document.createElement("div");

    const handle = action(node, "a");
    handle.update("b");
    expect(node.hasAttribute("aria-controls")).toBe(false);
    handle.destroy();
  });

  it("dispatches events to the handler of the new item", () => {
    const onClick = vi.fn();
    const api = writable({
      getProps: (id: string): ElementProps => ({ onClick: () => onClick(id) }),
    });
    const action = createItemAction(api, (a, id: string) => a.getProps(id));
    const node = document.createElement("button");

    const handle = action(node, "a");
    handle.update("b");
    node.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith("b");
    handle.destroy();
  });
});

describe("item actions", () => {
  it("move a tab to its new value when the parameter changes", () => {
    const tabs = createTabs({ items: [{ value: "a" }, { value: "b" }], value: "b" });
    const node = document.createElement("button");

    const handle = tabs.tabAction(node, "a");
    expect(node.getAttribute("aria-selected")).toBe("false");

    handle?.update?.("b");
    expect(node.getAttribute("aria-selected")).toBe("true");
    handle?.destroy?.();
  });

  it("move a navigation menu trigger to its new item and open that item on click", () => {
    const nav = createNavigationMenu({ value: null });
    const node = document.createElement("button");
    document.body.append(node);

    const handle = nav.triggerAction(node, "a");
    handle?.update?.("b");
    expect(node.getAttribute("aria-expanded")).toBe("false");
    node.click();
    expect(get(nav.value)).toBe("b");
    expect(node.getAttribute("aria-expanded")).toBe("true");
    handle?.destroy?.();
    node.remove();
  });
});
