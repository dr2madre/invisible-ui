import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, matchItem } from "./state";
import type { MenuItem, MenuState } from "./types";

const items: MenuItem[] = [
  { value: "new", label: "New file" },
  { value: "open", label: "Open" },
  { value: "sep", label: "Separator", disabled: true },
  { value: "save", label: "Save" },
];

const stateFor = (overrides: Partial<MenuState> = {}): MenuState => ({
  open: false,
  activeValue: null,
  items,
  disabled: false,
  id: "m",
  ...overrides,
});

const harness = (overrides: Partial<MenuState> = {}) => {
  const setOpen = vi.fn();
  const setActiveValue = vi.fn();
  const onSelect = vi.fn();
  const api = connect({ state: stateFor(overrides), setOpen, setActiveValue, onSelect });
  return { api, setOpen, setActiveValue, onSelect };
};

const key = (k: string) => ({ key: k, preventDefault: vi.fn() }) as unknown as Event;

describe("menu state", () => {
  it("defaults to closed", () => {
    expect(initialState({ items }).open).toBe(false);
  });
  it("typeahead matches labels, skipping disabled and wrapping", () => {
    expect(matchItem(items, "o", null)).toBe("open");
    expect(matchItem(items, "s", "open")).toBe("save"); // skips disabled "sep"
    expect(matchItem(items, "n", "save")).toBe("new"); // wraps
  });
});

describe("menu connect", () => {
  it("exposes a menu-button trigger", () => {
    const { api } = harness();
    expect(api.triggerProps["aria-haspopup"]).toBe("menu");
    expect(api.triggerProps["aria-expanded"]).toBe(false);
    expect(api.menuProps.role).toBe("menu");
  });

  it("opens to the first item on ArrowDown, last on ArrowUp", () => {
    const down = harness();
    (down.api.triggerProps.onKeyDown as (e: Event) => void)(key("ArrowDown"));
    expect(down.setActiveValue).toHaveBeenCalledWith("new");
    expect(down.setOpen).toHaveBeenCalledWith(true);

    const up = harness();
    (up.api.triggerProps.onKeyDown as (e: Event) => void)(key("ArrowUp"));
    expect(up.setActiveValue).toHaveBeenCalledWith("save");
  });

  it("moves the active item with arrows, skipping disabled", () => {
    const { api, setActiveValue } = harness({ open: true, activeValue: "open" });
    (api.menuProps.onKeyDown as (e: Event) => void)(key("ArrowDown"));
    expect(setActiveValue).toHaveBeenCalledWith("save"); // skips disabled "sep"
  });

  it("activates the active item on Enter and closes", () => {
    const { api, onSelect, setOpen } = harness({ open: true, activeValue: "save" });
    (api.menuProps.onKeyDown as (e: Event) => void)(key("Enter"));
    expect(onSelect).toHaveBeenCalledWith("save");
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("closes on Escape without selecting", () => {
    const { api, onSelect, setOpen } = harness({ open: true, activeValue: "save" });
    (api.menuProps.onKeyDown as (e: Event) => void)(key("Escape"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("activates on click but refuses disabled items", () => {
    const { api, onSelect } = harness({ open: true });
    (api.getItemProps("open").onClick as () => void)();
    expect(onSelect).toHaveBeenCalledWith("open");

    onSelect.mockClear();
    (api.getItemProps("sep").onClick as () => void)(); // disabled
    expect(onSelect).not.toHaveBeenCalled();
    expect(api.getItemProps("sep")["aria-disabled"]).toBe(true);
  });

  it("does not open when disabled", () => {
    const { api, setOpen } = harness({ disabled: true });
    api.openMenu();
    expect(setOpen).not.toHaveBeenCalled();
  });
});
