import { render, screen, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Menubar } from "./Menubar";
import type { MenubarMenu } from "./use-menubar";

// The popups teleport to document.body, so the axe scan covers the whole page;
// the landmark (region) rule judges the bare fixture's page structure, not the
// component, and is off here.
const noAxeRegion = { rules: { region: { enabled: false } } };

const menus: MenubarMenu[] = [
  {
    value: "file",
    label: "File",
    items: [
      { value: "new", label: "New" },
      { value: "open", label: "Open" },
      { value: "save", label: "Save", disabled: true },
    ],
  },
  {
    value: "edit",
    label: "Edit",
    items: [
      { value: "undo", label: "Undo" },
      { value: "redo", label: "Redo" },
    ],
  },
  {
    value: "view",
    label: "View",
    items: [
      { value: "zoom-in", label: "Zoom in" },
      { value: "zoom-out", label: "Zoom out" },
    ],
  },
];

const renderMenubar = (props: Record<string, unknown> = {}) =>
  render(Menubar, { props: { label: "Main", menus, ...props } });

const trigger = (name: string) => screen.getByRole("menuitem", { name });

describe("Vue Menubar (styled)", () => {
  it("renders a horizontal menubar with a roving tabindex", () => {
    renderMenubar();
    const bar = screen.getByRole("menubar", { name: "Main" });
    expect(bar).toHaveAttribute("aria-orientation", "horizontal");

    expect(trigger("File")).toHaveAttribute("tabindex", "0");
    expect(trigger("Edit")).toHaveAttribute("tabindex", "-1");
    expect(trigger("View")).toHaveAttribute("tabindex", "-1");
    expect(trigger("File")).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens a menu on click and exposes its items", async () => {
    const user = userEvent.setup();
    renderMenubar();

    await user.click(trigger("File"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");
    // Each menu is named by its trigger (aria-labelledby), so scope by name.
    const menu = screen.getByRole("menu", { name: "File" });
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
    expect(within(menu).getByRole("menuitem", { name: "Save" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("activates an item and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenubar({ onSelect });

    await user.click(trigger("Edit"));
    await user.click(
      within(screen.getByRole("menu", { name: "Edit" })).getByRole("menuitem", { name: "Redo" }),
    );
    expect(onSelect).toHaveBeenCalledWith("edit", "redo");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus between triggers with ArrowLeft/Right while closed", async () => {
    const user = userEvent.setup();
    renderMenubar();

    trigger("File").focus();
    await user.keyboard("{ArrowRight}");
    expect(trigger("Edit")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(trigger("View")).toHaveFocus();
    await user.keyboard("{ArrowRight}"); // wraps
    expect(trigger("File")).toHaveFocus();
    await user.keyboard("{ArrowLeft}"); // wraps back
    expect(trigger("View")).toHaveFocus();
  });

  it("jumps to the first and last trigger with Home/End while closed", async () => {
    const user = userEvent.setup();
    renderMenubar();

    trigger("File").focus();
    await user.keyboard("{End}");
    expect(trigger("View")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(trigger("File")).toHaveFocus();
  });

  it("switches the open menu with ArrowRight while open", async () => {
    const user = userEvent.setup();
    renderMenubar();

    await user.click(trigger("File"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowRight}");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "true");
  });

  it("switches the open menu when another trigger is hovered", async () => {
    const user = userEvent.setup();
    renderMenubar();

    await user.click(trigger("File"));
    await user.hover(trigger("View"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("View")).toHaveAttribute("aria-expanded", "true");
  });

  it("opens with the keyboard and activates the active item via Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenubar({ onSelect });

    trigger("File").focus();
    await user.keyboard("{ArrowDown}"); // open, active = New
    await user.keyboard("{ArrowDown}"); // -> Open
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("file", "open");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenubar();

    await user.click(trigger("View"));
    await user.keyboard("{Escape}");
    expect(trigger("View")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("View")).toHaveFocus();
  });

  it("has no accessibility violations, closed and open", async () => {
    const user = userEvent.setup();
    renderMenubar();
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();

    await user.click(trigger("File"));
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});
