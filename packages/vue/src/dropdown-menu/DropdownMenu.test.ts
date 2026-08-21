import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { DropdownMenu } from "./DropdownMenu";
import type { MenuItem } from "./use-dropdown-menu";

// The popup teleports to document.body, so the axe scan covers the whole
// page; the landmark (region) rule judges the bare fixture's page structure,
// not the component, and is off here.
const noAxeRegion = { rules: { region: { enabled: false } } };

const items: MenuItem[] = [
  { value: "new", label: "New file" },
  { value: "open", label: "Open" },
  { value: "rename", label: "Rename", disabled: true },
  { value: "delete", label: "Delete" },
];

const renderMenu = (props: Record<string, unknown> = {}) =>
  render(DropdownMenu, { props: { label: "Actions", items, ...props } });

describe("Vue DropdownMenu (styled)", () => {
  it("renders a closed menu button", () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on click and exposes the menu items", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu")).toBeVisible();
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
  });

  it("reopens right after a selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu({ onSelect });
    const trigger = screen.getByRole("button", { name: "Actions" });

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Open" }));
    expect(onSelect).toHaveBeenCalledWith("open");

    // The very next mouse press must open again: the ghost guard arms only
    // after touch input, so quick successive mouse clicks all count.
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeVisible();
  });

  it("selects an item on click and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu({ onSelect });
    const trigger = screen.getByRole("button", { name: "Actions" });

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Open" }));
    expect(onSelect).toHaveBeenCalledWith("open");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with the keyboard and activates via Enter, skipping disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu({ onSelect });

    screen.getByRole("button", { name: "Actions" }).focus();
    await user.keyboard("{ArrowDown}"); // open, active = New file
    await user.keyboard("{ArrowDown}"); // -> Open
    await user.keyboard("{ArrowDown}"); // -> (Rename disabled) -> Delete
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("delete");
  });

  it("moves the highlight by typeahead", async () => {
    const user = userEvent.setup();
    renderMenu();

    screen.getByRole("button", { name: "Actions" }).focus();
    await user.keyboard("{ArrowDown}"); // open, active = New file
    await user.keyboard("d"); // -> Delete
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Actions" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("renders groups, separators and checkable items", async () => {
    const user = userEvent.setup();
    renderMenu({
      items: [
        {
          type: "group",
          label: "Sort by",
          items: [
            { value: "name", label: "Name", kind: "radio", checked: true },
            { value: "date", label: "Date", kind: "radio" },
          ],
        },
        { type: "separator" },
        { value: "compact", label: "Compact rows", kind: "checkbox", checked: false },
        { value: "rename", label: "Rename" },
      ],
    });
    await user.click(screen.getByRole("button", { name: "Actions" }));

    // Each kind announces itself, and a checkable item always says whether
    // it is on.
    const name = screen.getByRole("menuitemradio", { name: "Name" });
    expect(name).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Date" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("menuitemcheckbox", { name: "Compact rows" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("menuitem", { name: "Rename" })).not.toHaveAttribute("aria-checked");

    // The group carries its own name, and the separator is announced as one.
    expect(screen.getByRole("group", { name: "Sort by" })).toContainElement(name);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("walks through grouped items with the arrow keys, skipping the separator", async () => {
    const user = userEvent.setup();
    renderMenu({
      items: [
        { type: "group", label: "Sort by", items: [{ value: "name", label: "Name" }] },
        { type: "separator" },
        { value: "rename", label: "Rename" },
      ],
    });
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Name" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
  });

  it("marks disabled items", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});
