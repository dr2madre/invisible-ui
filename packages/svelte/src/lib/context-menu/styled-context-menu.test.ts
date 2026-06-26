import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./context-menu.fixture.svelte";

const openAt = (x = 40, y = 40) =>
  fireEvent.contextMenu(screen.getByText("Right-click here"), { clientX: x, clientY: y });

describe("Svelte ContextMenu (styled)", () => {
  it("is closed until the region is right-clicked", () => {
    render(Fixture);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens at the pointer on contextmenu and exposes the items", async () => {
    render(Fixture, { props: { onSelect: undefined } });
    await openAt();
    const menu = screen.getByRole("menu");
    expect(menu).toBeVisible();
    expect(menu).toHaveAttribute("aria-label", "Page actions");
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
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
    await user.keyboard("{ArrowDown}"); // skips disabled "Save as…" -> Inspect
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("inspect");
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

  it("marks disabled items", async () => {
    render(Fixture);
    await openAt();
    expect(screen.getByRole("menuitem", { name: "Save as…" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(Fixture);
    await openAt();
    expect(await axe(container)).toHaveNoViolations();
  });
});
