import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./popover.fixture.svelte";
import HoverFixture from "./popover-hover.fixture.svelte";

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

describe("Svelte Popover (trigger=hover)", () => {
  const card = () => document.querySelector<HTMLElement>(".popover__content");
  // pointerenter/leave don't bubble, so the wrapper (which carries the
  // listeners) must be the event target.
  const triggerWrap = () => document.querySelector<HTMLElement>(".popover__hover-trigger")!;

  it("is closed by default", () => {
    render(HoverFixture);
    expect(card()).toBeNull();
  });

  it("opens on keyboard focus of the trigger without moving focus", async () => {
    const onOpenChange = vi.fn();
    render(HoverFixture, { props: { onOpenChange } });

    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    // Focus is NOT moved into the card.
    expect(card()!.contains(document.activeElement)).toBe(false);
  });

  it("opens on pointer enter and closes on pointer leave", async () => {
    render(HoverFixture);

    await fireEvent.pointerEnter(triggerWrap());
    expect(card()).not.toBeNull();

    await fireEvent.pointerLeave(triggerWrap());
    expect(card()).toBeNull();
  });

  it("first click opens the preview; once open the default proceeds", async () => {
    render(HoverFixture);
    const link = screen.getByRole("link", { name: "@ada" });

    // Closed: the click is consumed to open the preview (touch fallback).
    const firstDefaultAllowed = await fireEvent.click(link);
    expect(firstDefaultAllowed).toBe(false);
    expect(card()).not.toBeNull();

    // Open: the click is not intercepted — the link would navigate.
    const secondDefaultAllowed = await fireEvent.click(link);
    expect(secondDefaultAllowed).toBe(true);
  });

  it("closes when focus leaves the trigger and card", async () => {
    render(HoverFixture);
    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();

    await fireEvent.focusIn(screen.getByRole("link", { name: "after" }));
    expect(card()).toBeNull();
  });

  it("closes on Escape", async () => {
    render(HoverFixture);
    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();

    await fireEvent.keyDown(document, { key: "Escape" });
    expect(card()).toBeNull();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(HoverFixture);
    await fireEvent.pointerEnter(triggerWrap());
    expect(await axe(container)).toHaveNoViolations();
  });
});
