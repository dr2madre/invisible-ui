import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef, useState } from "react";
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

// A multi-step workflow is a composition of the dialog's regions. The step
// state stays in the application; the dialog only lends the places to put it.
function Workflow({ step: initialStep = 1 }: { step?: 1 | 2 }) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const heading = useRef<HTMLHeadingElement>(null);
  const pending = useRef(false);

  // Focus lands on the new step heading, so the reader hears the new context
  // before its controls, and never stays on a control the step removed.
  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    heading.current?.focus();
  }, [step]);

  const goTo = (next: 1 | 2) => {
    pending.current = true;
    setStep(next);
  };

  return (
    <Dialog
      open
      title="Set up project"
      trigger="Set up project"
      bodyLayout="stack"
      footerClose
      headerMeta={`Step ${step} of 2`}
      footerLead={
        step === 2 ? (
          <Button variant="ghost" onClick={() => goTo(1)}>
            Back
          </Button>
        ) : undefined
      }
      footer={
        step === 1 ? (
          <Button variant="primary" onClick={() => goTo(2)}>
            Continue
          </Button>
        ) : (
          <Button variant="primary">Create project</Button>
        )
      }
    >
      <h3 tabIndex={-1} ref={heading}>
        {step === 1 ? "Choose a template" : "Name the project"}
      </h3>
      <label>
        Name <input type="text" />
      </label>
    </Dialog>
  );
}

describe("React Dialog (workflow composition)", () => {
  const panel = () => screen.getByRole("dialog");

  it("renders header metadata before the title, without progress semantics", () => {
    render(<Workflow />);
    const meta = panel().querySelector(".dialog__header-meta")!;
    const title = panel().querySelector(".dialog__title")!;

    expect(meta).toHaveTextContent("Step 1 of 2");
    expect(meta.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(meta).not.toHaveAttribute("role");
    expect(meta).not.toHaveAttribute("aria-live");
    expect(panel()).toHaveAccessibleName("Set up project");
  });

  it("keeps one footer action bar, leading actions first in source order", () => {
    render(<Workflow step={2} />);
    const footers = panel().querySelectorAll("footer");
    expect(footers).toHaveLength(1);

    const buttons = Array.from(footers[0]!.querySelectorAll("button")).map((b) =>
      b.textContent?.trim(),
    );
    expect(buttons).toEqual(["Back", "Close", "Create project"]);
  });

  it("keeps footerClose working alongside footerLead", async () => {
    const user = userEvent.setup();
    render(<Workflow step={2} />);
    const footerClose = within(
      panel().querySelector<HTMLElement>(".dialog__footer-lead")!,
    ).getByRole("button", { name: "Close" });

    await user.click(footerClose);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus to the new step heading, never leaving it on a removed control", async () => {
    const user = userEvent.setup();
    render(<Workflow />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Name the project" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Choose a template" })).toHaveFocus();
  });

  it("stacks the body sections and keeps the body the only scrolling region", () => {
    render(<Workflow />);
    const body = panel().querySelector(".dialog__body")!;

    expect(body).toHaveAttribute("data-layout", "stack");
    expect(panel().querySelector(":scope > header")).not.toBeNull();
    expect(panel().querySelector(":scope > footer")).not.toBeNull();
    expect(body.parentElement).toBe(panel());
  });

  it("leaves the body untouched by default", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(panel().querySelector(".dialog__body")).toHaveAttribute("data-layout", "plain");
    expect(panel().querySelector(".dialog__header-meta")).toBeNull();
    expect(panel().querySelector(".dialog__footer-lead")).toBeNull();
  });

  it("has no accessibility violations at either step", async () => {
    const { unmount } = render(<Workflow />);
    expect(await axe(document.body)).toHaveNoViolations();
    unmount();

    render(<Workflow step={2} />);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
