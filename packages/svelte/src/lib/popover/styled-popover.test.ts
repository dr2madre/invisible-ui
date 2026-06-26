import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./popover.fixture.svelte";

describe("Svelte Popover (styled)", () => {
  it("is closed by default with the trigger advertising the panel", () => {
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open popover" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Popover body")).not.toBeInTheDocument();
  });

  it("opens on click, moves focus into the panel, and reports it open", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Fixture, { props: { onOpenChange } });
    const trigger = screen.getByRole("button", { name: "Open popover" });

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Popover body")).toBeInTheDocument();
    // Focus moved to the first focusable inside the panel.
    expect(screen.getByRole("button", { name: "Action" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open popover" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByText("Popover body")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on an outside pointer press", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open popover" }));
    expect(screen.getByText("Popover body")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "before" }));
    expect(screen.queryByText("Popover body")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open popover" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
