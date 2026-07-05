import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./sheet-dialog.fixture.svelte";

// Native <dialog>: backdrop presses target the element itself with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });
const handleOf = (panel: HTMLElement) => panel.querySelector<HTMLElement>(".sheet-dialog__handle")!;

/** A pointer-ish event with controllable coordinates and timeStamp (jsdom lacks
 *  a reliable PointerEvent constructor, so we ride MouseEvent under the type name). */
function pointer(type: string, coords: { x?: number; y?: number }, timeStamp?: number) {
  const event = new MouseEvent(type, {
    clientX: coords.x ?? 0,
    clientY: coords.y ?? 0,
    button: 0,
    bubbles: true,
  });
  if (timeStamp !== undefined) Object.defineProperty(event, "timeStamp", { value: timeStamp });
  return event;
}

const stubExtent = (el: HTMLElement, prop: "offsetHeight" | "offsetWidth", value: number) =>
  Object.defineProperty(el, prop, { configurable: true, value });

describe("Svelte SheetDialog (styled)", () => {
  it("is closed by default", () => {
    render(Fixture);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as an edge-anchored modal, named + described, focus moved in", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { side: "left" } });

    await user.click(screen.getByRole("button", { name: "Open panel" }));
    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("data-side", "left");
    expect(modal).toHaveAccessibleName("Filters");
    expect(modal).toHaveAccessibleDescription("Refine the results.");
    expect(modal.contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open panel" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on a backdrop press and via the close button", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(screen.getByRole("button", { name: "Open panel" }));
    await pressBackdrop(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open panel" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("locks body scroll while open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open panel" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("renders no grab handle unless draggable (and never on top)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(Fixture, { props: { open: true } });
    expect(handleOf(screen.getByRole("dialog"))).toBeNull();
    unmount();

    render(Fixture, { props: { side: "top", draggable: true } });
    await user.click(screen.getByRole("button", { name: "Open panel" }));
    expect(handleOf(screen.getByRole("dialog"))).toBeNull();
  });

  it("tracks a bottom drag on the panel transform", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { side: "bottom", draggable: true } });
    await user.click(screen.getByRole("button", { name: "Open panel" }));
    const panel = screen.getByRole("dialog");

    await fireEvent(handleOf(panel), pointer("pointerdown", { y: 100 }));
    await fireEvent(window, pointer("pointermove", { y: 140 }));
    expect(panel.style.transform).toBe("translateY(40px)");
  });

  it("dismisses a bottom drag released past the distance threshold", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { side: "bottom", draggable: true } });
    await user.click(screen.getByRole("button", { name: "Open panel" }));
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetHeight", 400);

    // No move → velocity stays 0; only the release distance decides (250 > 25%·400).
    await fireEvent(handleOf(panel), pointer("pointerdown", { y: 100 }));
    await fireEvent(window, pointer("pointerup", { y: 350 }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("snaps back when released below the threshold", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { side: "bottom", draggable: true } });
    await user.click(screen.getByRole("button", { name: "Open panel" }));
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetHeight", 400);

    await fireEvent(handleOf(panel), pointer("pointerdown", { y: 100 }));
    await fireEvent(window, pointer("pointerup", { y: 150 })); // 50 < 25%·400, velocity 0
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(panel.style.transform).toBe("");
  });

  it("dismisses a lateral drag toward the anchored edge", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { side: "right", draggable: true } });
    await user.click(screen.getByRole("button", { name: "Open panel" }));
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetWidth", 320);

    // Rightward release past 25%·320 = 80px dismisses the right-anchored panel.
    await fireEvent(handleOf(panel), pointer("pointerdown", { x: 500 }));
    await fireEvent(window, pointer("pointerup", { x: 600 }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores a lateral drag away from the anchored edge", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { side: "right", draggable: true } });
    await user.click(screen.getByRole("button", { name: "Open panel" }));
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetWidth", 320);

    // Dragging leftward (inward) must not dismiss a right-anchored panel.
    await fireEvent(handleOf(panel), pointer("pointerdown", { x: 500 }));
    await fireEvent(window, pointer("pointerup", { x: 300 }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dismisses on a fast flick even when the distance is small", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { side: "bottom", draggable: true } });
    await user.click(screen.getByRole("button", { name: "Open panel" }));
    const panel = screen.getByRole("dialog");
    stubExtent(panel, "offsetHeight", 1000); // distance alone (20px) would never dismiss

    await fireEvent(handleOf(panel), pointer("pointerdown", { y: 100 }, 0));
    await fireEvent(window, pointer("pointermove", { y: 120 }, 10)); // 20px / 10ms = 2 px/ms
    await fireEvent(window, pointer("pointerup", { y: 120 }, 20));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { side: "bottom", draggable: true } });
    await user.click(screen.getByRole("button", { name: "Open panel" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
