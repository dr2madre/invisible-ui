import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./drawer.fixture.svelte";

const overlay = () => document.querySelector<HTMLElement>(".drawer__overlay");
const handleOf = (panel: HTMLElement) => panel.querySelector<HTMLElement>(".drawer__handle")!;

/** A pointer-ish event with controllable clientY and timeStamp (jsdom lacks a
 *  reliable PointerEvent constructor, so we ride MouseEvent under the type name). */
function pointer(type: string, clientY: number, timeStamp?: number) {
  const event = new MouseEvent(type, { clientY, button: 0, bubbles: true });
  if (timeStamp !== undefined) Object.defineProperty(event, "timeStamp", { value: timeStamp });
  return event;
}

const stubHeight = (el: HTMLElement, value: number) =>
  Object.defineProperty(el, "offsetHeight", { configurable: true, value });

describe("Svelte Drawer (styled)", () => {
  it("is closed by default", () => {
    render(Fixture);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a modal, named + described, focus moved in", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAccessibleName("Account");
    expect(modal).toHaveAccessibleDescription("Manage your account.");
    expect(modal.contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape, backdrop press, and the close button", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open drawer" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await fireEvent.pointerDown(overlay()!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("tracks the drag offset on the panel transform", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog");

    await fireEvent(handleOf(panel), pointer("pointerdown", 100));
    await fireEvent(window, pointer("pointermove", 140));
    expect(panel.style.transform).toBe("translateY(40px)");
  });

  it("dismisses when released past the distance threshold", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog");
    stubHeight(panel, 400);

    // No move → velocity stays 0; only the release distance decides (250 > 25%·400).
    await fireEvent(handleOf(panel), pointer("pointerdown", 100));
    await fireEvent(window, pointer("pointerup", 350));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("snaps back (stays open, offset reset) when released below the threshold", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog");
    stubHeight(panel, 400);

    await fireEvent(handleOf(panel), pointer("pointerdown", 100));
    await fireEvent(window, pointer("pointerup", 150)); // 50 < 25%·400, velocity 0
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(panel.style.transform).toBe("translateY(0px)");
  });

  it("dismisses on a fast flick even when the distance is small", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog");
    stubHeight(panel, 1000); // distance alone (20px) would never dismiss

    await fireEvent(handleOf(panel), pointer("pointerdown", 100, 0));
    await fireEvent(window, pointer("pointermove", 120, 10)); // 20px / 10ms = 2 px/ms
    await fireEvent(window, pointer("pointerup", 120, 20));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
