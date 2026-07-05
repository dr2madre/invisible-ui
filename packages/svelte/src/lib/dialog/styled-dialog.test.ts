import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./dialog.fixture.svelte";

// Native <dialog>: backdrop presses target the element itself with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });

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

    await pressBackdrop(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a native <dialog> shown modally (inert background is the browser's)", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog");
    expect(panel.tagName).toBe("DIALOG");
    expect((panel as HTMLDialogElement).open).toBe(true);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
