import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import { Dialog } from "./Dialog";

// Native <dialog>: backdrop presses target the element itself, with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });

const Basic = (props: Partial<React.ComponentProps<typeof Dialog>> = {}) => (
  <Dialog
    title="Share this file"
    description="Anyone with the link can view it."
    trigger="Open dialog"
    {...props}
  >
    <p>Body content</p>
  </Dialog>
);

describe("React Dialog (styled)", () => {
  it("is closed by default with the trigger advertising the dialog", () => {
    render(<Basic />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a modal, named and described, with focus moved inside", async () => {
    const user = userEvent.setup();
    render(<Basic />);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog", { name: "Share this file" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAccessibleDescription("Anyone with the link can view it.");
    // Focus lands on the panel itself, never on the close button.
    expect(panel).toHaveFocus();
  });

  it("is a native <dialog> shown modally (the inert background is the browser's)", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog") as HTMLDialogElement;
    expect(panel.tagName).toBe("DIALOG");
    expect(panel.open).toBe(true);
  });

  it("opens and closes when the open prop changes", () => {
    const { rerender } = render(<Basic open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<Basic open={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(<Basic open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    render(<Basic />);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on a backdrop press", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    pressBackdrop(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog open on a backdrop press when opted out", async () => {
    const user = userEvent.setup();
    render(<Basic closeOnOutsideClick={false} />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    pressBackdrop(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("honours initialFocus", async () => {
    const user = userEvent.setup();
    render(
      <Dialog title="Rename" trigger="Open dialog" initialFocus=".target">
        <input className="target" aria-label="New name" />
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("textbox", { name: "New name" })).toHaveFocus();
  });

  it("reports open-state changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps a hidden title as the accessible name", async () => {
    const user = userEvent.setup();
    render(<Basic hideTitle />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog", { name: "Share this file" });
    expect(panel.querySelector(".dialog__title")).toHaveClass("dialog__title--hidden");
  });

  it("renders footer actions and an optional footer close", async () => {
    const user = userEvent.setup();
    render(<Basic footerClose footer={<Button variant="primary">Save</Button>} />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    // Two "Close": the header ✕ and the footer button.
    expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(2);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React Dialog (stacked)", () => {
  /** An outer dialog whose footer opens a second, confirming dialog. */
  function Nested() {
    const [confirmOpen, setConfirmOpen] = useState(false);
    return (
      <Dialog
        title="Edit profile"
        trigger="Open dialog"
        footer={
          <>
            <Button onPress={() => setConfirmOpen(true)}>Discard</Button>
            <Dialog
              title="Discard changes?"
              trigger="hidden"
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
            >
              <p>Your edits will be lost.</p>
            </Dialog>
          </>
        }
      >
        <p>Body content</p>
      </Dialog>
    );
  }

  it("stacks a second dialog; Escape closes only the innermost", async () => {
    const user = userEvent.setup();
    render(<Nested />);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(2);

    // The core stops Escape from bubbling, so only the inner dialog closes.
    await user.keyboard("{Escape}");
    const remaining = screen.getAllByRole("dialog");
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toHaveAccessibleName("Edit profile");
  });
});
