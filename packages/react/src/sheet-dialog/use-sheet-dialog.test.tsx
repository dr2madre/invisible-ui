import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useSheetDialog, type SheetDialogSide } from "./use-sheet-dialog";

/** The headless layer with markup the consumer owns. */
function Bare({ side }: { side: SheetDialogSide }) {
  const { api, open, triggerRef, panelRef, dragging, onHandlePointerDown } = useSheetDialog({
    side,
  });
  return (
    <>
      <button {...api.triggerProps} ref={triggerRef} type="button">
        Details
      </button>
      {open ? (
        <dialog {...api.contentProps} ref={panelRef} data-dragging={dragging || undefined}>
          <div data-testid="handle" onPointerDown={onHandlePointerDown} />
          <h2 {...api.titleProps}>Order details</h2>
        </dialog>
      ) : null}
    </>
  );
}

describe("useSheetDialog (headless)", () => {
  it("drives a consumer's own markup, with the drag on its handle", async () => {
    const user = userEvent.setup();
    render(<Bare side="left" />);

    await user.click(screen.getByRole("button", { name: "Details" }));
    const panel = screen.getByRole("dialog", { name: "Order details" });
    Object.defineProperty(panel, "offsetWidth", { configurable: true, value: 300 });

    fireEvent.pointerDown(screen.getByTestId("handle"), { clientX: 200, pointerId: 1 });
    expect(panel).toHaveAttribute("data-dragging");
    // Toward the left edge is outward for a left-anchored panel.
    fireEvent.pointerMove(window, { clientX: 170, pointerId: 1 });
    expect(panel.style.transform).toBe("translateX(-30px)");

    fireEvent.pointerUp(window, { clientX: 100, pointerId: 1 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores another pointer while a drag is in flight", async () => {
    const user = userEvent.setup();
    render(<Bare side="bottom" />);

    await user.click(screen.getByRole("button", { name: "Details" }));
    const panel = screen.getByRole("dialog");
    Object.defineProperty(panel, "offsetHeight", { configurable: true, value: 400 });

    fireEvent.pointerDown(screen.getByTestId("handle"), { clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(window, { clientY: 390, pointerId: 2 });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(panel).toHaveAttribute("data-dragging");
  });
});
