import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./dialog.fixture.svelte";

const overlay = () => document.querySelector<HTMLElement>(".dialog__overlay");

describe("Svelte Dialog (styled)", () => {
  it("is closed by default with the trigger advertising the dialog", () => {
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a modal, named and described, with focus moved inside", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Fixture, { props: { onOpenChange } });

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const modal = screen.getByRole("dialog");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAccessibleName("Edit profile");
    expect(modal).toHaveAccessibleDescription("Update your details.");
    // Focus moved into the panel.
    expect(modal.contains(document.activeElement)).toBe(true);
  });

  it("opens and closes when the open prop changes", async () => {
    const { rerender } = render(Fixture, { props: { open: false } });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await rerender({ open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await rerender({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open dialog" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on a backdrop press", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await fireEvent.pointerDown(overlay()!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("traps Tab focus within the panel", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const close = screen.getByRole("button", { name: "Close" });
    const save = screen.getByRole("button", { name: "Save" });

    // Tab past the last focusable wraps to the first (the close button).
    save.focus();
    await fireEvent.keyDown(save, { key: "Tab" });
    expect(close).toHaveFocus();

    // Shift+Tab before the first wraps to the last (Save).
    close.focus();
    await fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(save).toHaveFocus();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
