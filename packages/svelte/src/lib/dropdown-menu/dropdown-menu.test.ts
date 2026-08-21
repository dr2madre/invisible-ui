import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Fixture from "./dropdown-menu.fixture.svelte";

describe("Svelte DropdownMenu (styled)", () => {
  it("renders a closed menu button", () => {
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on click and exposes the menu items", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu")).toBeVisible();
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
  });

  it("selects an item on click and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });
    const trigger = screen.getByRole("button", { name: "Actions" });

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Open" }));
    expect(onSelect).toHaveBeenCalledWith("open");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with the keyboard and activates via Enter, skipping disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });
    const trigger = screen.getByRole("button", { name: "Actions" });

    trigger.focus();
    await user.keyboard("{ArrowDown}"); // open, active = New file
    await user.keyboard("{ArrowDown}"); // -> Open
    await user.keyboard("{ArrowDown}"); // -> (Rename disabled) -> Delete
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("delete");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Actions" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("renders groups, separators and checkable items", async () => {
    const user = userEvent.setup();
    render(Fixture, {
      props: {
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
      },
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
    const group = screen.getByRole("group", { name: "Sort by" });
    expect(group).toContainElement(name);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("walks through grouped items with the arrow keys, skipping the separator", async () => {
    const user = userEvent.setup();
    render(Fixture, {
      props: {
        items: [
          { type: "group", label: "Sort by", items: [{ value: "name", label: "Name" }] },
          { type: "separator" },
          { value: "rename", label: "Rename" },
        ],
      },
    });
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Name" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
  });

  it("marks disabled items", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
