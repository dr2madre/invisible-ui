import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./menubar.fixture.svelte";

const trigger = (name: string) => screen.getByRole("menuitem", { name });

describe("Svelte Menubar (styled)", () => {
  it("renders a horizontal menubar with roving tabindex", () => {
    render(Fixture);
    const bar = screen.getByRole("menubar");
    expect(bar).toHaveAttribute("aria-orientation", "horizontal");

    // Closed: only the three triggers are exposed (popups are hidden).
    expect(trigger("File")).toHaveAttribute("tabindex", "0");
    expect(trigger("Edit")).toHaveAttribute("tabindex", "-1");
    expect(trigger("View")).toHaveAttribute("tabindex", "-1");
    expect(trigger("File")).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens a menu on click and exposes its items", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(trigger("File"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");
    // Each menu is named by its trigger (aria-labelledby), so scope by name —
    // all popups stay in the DOM (hidden via CSS, which jsdom doesn't apply).
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
    render(Fixture, { props: { onSelect } });

    await user.click(trigger("Edit"));
    await user.click(
      within(screen.getByRole("menu", { name: "Edit" })).getByRole("menuitem", { name: "Redo" }),
    );
    expect(onSelect).toHaveBeenCalledWith("edit", "redo");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus between triggers with ArrowLeft/Right (closed)", async () => {
    const user = userEvent.setup();
    render(Fixture);

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

  it("switches the open menu with ArrowRight while open", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(trigger("File"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowRight}");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "true");
  });

  it("opens with the keyboard and activates the active item via Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });

    trigger("File").focus();
    await user.keyboard("{ArrowDown}"); // open, active = New
    await user.keyboard("{ArrowDown}"); // -> Open
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("file", "open");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(trigger("View"));
    await user.keyboard("{Escape}");
    expect(trigger("View")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("View")).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();

    const user = userEvent.setup();
    await user.click(trigger("File"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
