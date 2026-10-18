import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, nextTick, type PropType } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ContextMenu } from "./ContextMenu";
import type { MenuItem } from "./use-context-menu";

// The popup teleports to document.body, so the axe scan covers the whole page;
// the landmark (region) rule judges the bare fixture's page structure, not the
// component, and is off here.
const noAxeRegion = { rules: { region: { enabled: false } } };

const items: MenuItem[] = [
  { value: "back", label: "Back" },
  { value: "reload", label: "Reload" },
  { value: "save", label: "Save as…", disabled: true },
  { value: "inspect", label: "Inspect" },
];

const Fixture = defineComponent({
  props: {
    disabled: { type: Boolean, default: false },
    onSelect: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  setup(props) {
    return () => [
      h("button", { type: "button" }, "before"),
      h(
        ContextMenu,
        {
          items,
          disabled: props.disabled,
          onSelect: props.onSelect,
          label: "Page actions",
        },
        { default: () => h("div", "Right-click here") },
      ),
      h("button", { type: "button" }, "after"),
    ];
  },
});

const openAt = (x = 40, y = 40) =>
  fireEvent.contextMenu(screen.getByText("Right-click here"), { clientX: x, clientY: y });

describe("Vue ContextMenu (styled)", () => {
  it("is closed until the region is right-clicked", () => {
    render(Fixture);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens at the pointer on contextmenu and exposes the items", async () => {
    render(Fixture);
    await openAt();
    const menu = screen.getByRole("menu");
    expect(menu).toBeVisible();
    expect(menu).toHaveAttribute("aria-label", "Page actions");
    expect(menu).not.toHaveAttribute("aria-labelledby");
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
  });

  it("stays closed while disabled", async () => {
    render(Fixture, { props: { disabled: true } });
    await openAt();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("selects an item on click and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });

    await openAt();
    await user.click(screen.getByRole("menuitem", { name: "Reload" }));
    expect(onSelect).toHaveBeenCalledWith("reload");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("navigates with the keyboard and activates via Enter, skipping disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });

    await openAt(); // active = Back (first enabled)
    await user.keyboard("{ArrowDown}"); // -> Reload
    await user.keyboard("{ArrowDown}"); // skips the disabled "Save as…" -> Inspect
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("inspect");
  });

  it("moves the highlight by typeahead", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openAt();
    await user.keyboard("i");
    expect(screen.getByRole("menuitem", { name: "Inspect" })).toHaveFocus();
  });

  it("closes on Escape and restores focus to where it was", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const before = screen.getByRole("button", { name: "before" });
    before.focus();

    await openAt();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(before).toHaveFocus();
  });

  it("closes on an outside pointer press", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await openAt();
    expect(screen.getByRole("menu")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "after" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when the page scrolls under it", async () => {
    render(Fixture);

    await openAt();
    expect(screen.getByRole("menu")).toBeVisible();
    // The menu is anchored to a point in the viewport, so that point stops
    // meaning anything once the page scrolls.
    window.dispatchEvent(new Event("scroll"));
    await nextTick();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("marks disabled items", async () => {
    render(Fixture);
    await openAt();
    expect(screen.getByRole("menuitem", { name: "Save as…" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("has no accessibility violations when open", async () => {
    render(Fixture);
    await openAt();
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});

// jsdom has no layout: the viewport measures 1024 by 768, and the region the
// text sits in 100 by 50 at (10, 20).
const placeRegion = () => {
  const root = document.documentElement;
  Object.defineProperty(root, "clientWidth", { configurable: true, value: 1024 });
  Object.defineProperty(root, "clientHeight", { configurable: true, value: 768 });
  const rect = { x: 10, y: 20, left: 10, top: 20, right: 110, bottom: 70, width: 100, height: 50 };
  let el: Element | null = screen.getByText("Right-click here");
  while (el && el !== document.body) {
    el.getBoundingClientRect = () => ({ ...rect, toJSON: () => rect }) as DOMRect;
    el = el.parentElement;
  }
};
const menuLeft = () => screen.getByRole("menu").style.left;

describe("Vue ContextMenu in right-to-left text", () => {
  afterEach(() => {
    const root = document.documentElement as unknown as Record<string, unknown>;
    delete root.clientWidth;
    delete root.clientHeight;
    document.documentElement.removeAttribute("dir");
  });

  it("opens toward the inline end, from the inline-start corner on the keyboard", async () => {
    render(Fixture);
    placeRegion();
    await openAt(40, 40);
    await vi.waitFor(() => expect(menuLeft()).toBe("42px"));
    await fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await openAt(0, 0);
    await vi.waitFor(() => expect(menuLeft()).toBe("12px"));
    await fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

    document.documentElement.dir = "rtl";
    await openAt(40, 40);
    await vi.waitFor(() => expect(menuLeft()).toBe("38px"));
    await fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await openAt(0, 0);
    await vi.waitFor(() => expect(menuLeft()).toBe("108px"));
  });
});
