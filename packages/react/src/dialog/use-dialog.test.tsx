import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useDialog, type DialogRole } from "./use-dialog";

/**
 * The headless layer with markup the consumer owns — the reason the hook is
 * exported. Nothing here uses the styled `Dialog`.
 */
function Bare({ role, describedBy = false }: { role?: DialogRole; describedBy?: boolean }) {
  const { api, open, triggerRef, panelRef } = useDialog({ role, describedBy });

  return (
    <>
      <button {...api.triggerProps} ref={triggerRef} type="button">
        Open
      </button>
      {open && (
        <dialog {...api.contentProps} ref={panelRef}>
          <h2 {...api.titleProps}>Careful</h2>
          {describedBy && <p {...api.descriptionProps}>This cannot be undone.</p>}
          <button {...api.closeProps} type="button">
            Close
          </button>
        </dialog>
      )}
    </>
  );
}

describe("useDialog (headless)", () => {
  it("drives a consumer's own markup", async () => {
    const user = userEvent.setup();
    render(<Bare />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    const panel = screen.getByRole("dialog", { name: "Careful" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect((panel as HTMLDialogElement).open).toBe(true);
  });

  it("opts into the alertdialog role", async () => {
    const user = userEvent.setup();
    render(<Bare role="alertdialog" />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("alertdialog", { name: "Careful" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("wires aria-describedby only when a description is present", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Bare />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-describedby");

    await user.keyboard("{Escape}");
    rerender(<Bare describedBy />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("This cannot be undone.");
  });

  it("closes through the close prop bag", async () => {
    const user = userEvent.setup();
    render(<Bare />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
