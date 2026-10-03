import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import type { DialogHandle } from "../dialog/use-dialog-handle";
import { SheetDialog } from "./SheetDialog";

// Native <dialog>: backdrop presses target the element itself with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });
const handleOf = (panel: HTMLElement) => panel.querySelector<HTMLElement>(".sheet-dialog__handle")!;

/** A pointer event with controllable coordinates and timeStamp. */
function pointer(
  target: Element | Window,
  type: "pointerdown" | "pointermove" | "pointerup",
  coords: { x?: number; y?: number },
  timeStamp?: number,
) {
  const event = new PointerEvent(type, {
    clientX: coords.x ?? 0,
    clientY: coords.y ?? 0,
    button: 0,
    pointerId: 1,
    bubbles: true,
  });
  if (timeStamp !== undefined) Object.defineProperty(event, "timeStamp", { value: timeStamp });
  fireEvent(target, event);
}

const stubExtent = (el: HTMLElement, prop: "offsetHeight" | "offsetWidth", value: number) =>
  Object.defineProperty(el, prop, { configurable: true, value });

const Sheet = (props: Partial<ComponentProps<typeof SheetDialog>>) => (
  <>
    <button type="button">before</button>
    <SheetDialog
      title="Filters"
      description="Refine the results."
      trigger={<span>Open panel</span>}
      {...props}
    >
      <label>
        Query <input type="text" />
      </label>
      <button type="button">Apply</button>
    </SheetDialog>
  </>
);

const openIt = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Open panel" }));

describe("React SheetDialog (styled)", () => {
  it("is closed by default", () => {
    render(<Sheet />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as an edge-anchored modal, named and described, focus moved in", async () => {
    const user = userEvent.setup();
    render(<Sheet side="left" />);

    await openIt(user);
    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("data-side", "left");
    expect(modal).toHaveAccessibleName("Filters");
    expect(modal).toHaveAccessibleDescription("Refine the results.");
    expect(modal.contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    const trigger = screen.getByRole("button", { name: "Open panel" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on a backdrop press and via the close button", async () => {
    const user = userEvent.setup();
    render(<Sheet />);

    await openIt(user);
    pressBackdrop(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openIt(user);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("locks body scroll while open", async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    await openIt(user);
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("honours initialFocus and renders the footer and header regions", async () => {
    const user = userEvent.setup();
    render(
      <Sheet
        initialFocus="input"
        headerActions={<Button>Reset</Button>}
        footer={<Button variant="primary">Show results</Button>}
      />,
    );
    await openIt(user);
    expect(screen.getByRole("textbox", { name: "Query" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show results" }).closest(".sheet-dialog__footer"),
    ).not.toBeNull();
  });

  it("renders no grab handle unless draggable (and never on top)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Sheet open />);
    expect(handleOf(screen.getByRole("dialog"))).toBeNull();
    unmount();

    render(<Sheet side="top" draggable />);
    await openIt(user);
    expect(handleOf(screen.getByRole("dialog"))).toBeNull();
  });

  it("tracks a bottom drag on the panel transform", async () => {
    const user = userEvent.setup();
    render(<Sheet side="bottom" draggable />);
    await openIt(user);
    const panel = screen.getByRole("dialog");

    pointer(handleOf(panel), "pointerdown", { y: 100 });
    expect(panel).toHaveClass("sheet-dialog__panel--dragging");
    pointer(window, "pointermove", { y: 140 });
    expect(panel.style.transform).toBe("translateY(40px)");
  });

  it("dismisses a bottom drag released past the distance threshold", async () => {
    const user = userEvent.setup();
    render(<Sheet side="bottom" draggable />);
    await openIt(user);
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetHeight", 400);

    // No move, so velocity stays 0: only the release distance decides (250 > 25% of 400).
    pointer(handleOf(panel), "pointerdown", { y: 100 });
    pointer(window, "pointerup", { y: 350 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("snaps back when released below the threshold", async () => {
    const user = userEvent.setup();
    render(<Sheet side="bottom" draggable />);
    await openIt(user);
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetHeight", 400);

    pointer(handleOf(panel), "pointerdown", { y: 100 });
    pointer(window, "pointermove", { y: 150 }, Number.MAX_SAFE_INTEGER);
    pointer(window, "pointerup", { y: 150 }); // 50 < 25% of 400, slow
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(panel.style.transform).toBe("");
    expect(panel).not.toHaveClass("sheet-dialog__panel--dragging");
  });

  it("dismisses a lateral drag toward the anchored edge", async () => {
    const user = userEvent.setup();
    render(<Sheet side="right" draggable />);
    await openIt(user);
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetWidth", 320);

    // Rightward release past 25% of 320 = 80px dismisses the right-anchored panel.
    pointer(handleOf(panel), "pointerdown", { x: 500 });
    pointer(window, "pointerup", { x: 600 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores a lateral drag away from the anchored edge", async () => {
    const user = userEvent.setup();
    render(<Sheet side="right" draggable />);
    await openIt(user);
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetWidth", 320);

    // Dragging leftward (inward) must not dismiss a right-anchored panel.
    pointer(handleOf(panel), "pointerdown", { x: 500 });
    pointer(window, "pointerup", { x: 300 });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dismisses on a fast flick even when the distance is small", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Sheet side="bottom" draggable onOpenChange={onOpenChange} />);
    await openIt(user);
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetHeight", 1000); // distance alone (20px) would never dismiss

    pointer(handleOf(panel), "pointerdown", { y: 100 }, 0);
    pointer(window, "pointermove", { y: 120 }, 10); // 20px in 10ms = 2 px/ms
    pointer(window, "pointerup", { y: 120 }, 20);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("holds the status area on its ref (ADR 0016)", async () => {
    const user = userEvent.setup();
    const ref = createRef<DialogHandle>();
    render(<Sheet ref={ref} footer={<Button>Apply filters</Button>} />);
    await openIt(user);

    act(() => {
      ref.current?.notify({ status: "info", title: "12 results match" });
    });
    const notice = screen.getByRole("group", { name: "12 results match" });
    // Between the body and the footer.
    expect(notice.closest(".dialog-status")?.previousElementSibling).toHaveClass(
      "sheet-dialog__body",
    );
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(<Sheet side="bottom" draggable />);
    await openIt(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("React SheetDialog without a trigger of its own", () => {
  it("renders no trigger, opens from outside, and returns focus where it was told", () => {
    const opener = document.createElement("button");
    opener.id = "opener";
    opener.textContent = "Open it";
    document.body.appendChild(opener);
    // Focus is somewhere else when the panel opens, so only the named element
    // can be where it comes back to.
    const elsewhere = document.createElement("button");
    elsewhere.textContent = "elsewhere";
    document.body.appendChild(elsewhere);
    elsewhere.focus();

    const { rerender } = render(<Sheet renderTrigger={false} returnFocusTo="#opener" />);
    expect(screen.queryByRole("button", { name: "Open panel" })).toBeNull();

    rerender(<Sheet renderTrigger={false} returnFocusTo="#opener" open />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // The panel takes focus, so the return is a real move.
    expect(document.activeElement).not.toBe(opener);

    rerender(<Sheet renderTrigger={false} returnFocusTo="#opener" open={false} />);
    expect(document.activeElement).toBe(opener);
    opener.remove();
    elsewhere.remove();
  });

  it("still renders its own trigger by default", () => {
    render(<Sheet />);
    expect(screen.getByRole("button", { name: "Open panel" })).toBeInTheDocument();
  });
});
