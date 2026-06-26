import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./hover-card.fixture.svelte";

const card = () => document.querySelector<HTMLElement>(".hover-card__content");
// pointerenter/leave don't bubble, so the wrapper (which carries the listeners)
// must be the event target — in a real browser the pointer enters it too.
const triggerWrap = () => document.querySelector<HTMLElement>(".hover-card__trigger")!;

afterEach(() => vi.useRealTimers());

describe("Svelte HoverCard (styled)", () => {
  it("is closed by default", () => {
    render(Fixture);
    expect(card()).toBeNull();
  });

  it("opens on keyboard focus of the trigger", async () => {
    const onOpenChange = vi.fn();
    render(Fixture, { props: { onOpenChange } });

    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    // Focus is NOT moved into the card.
    expect(card()!.contains(document.activeElement)).toBe(false);
  });

  it("opens on pointer enter and closes on pointer leave", async () => {
    render(Fixture);

    await fireEvent.pointerEnter(triggerWrap());
    expect(card()).not.toBeNull();

    await fireEvent.pointerLeave(triggerWrap());
    expect(card()).toBeNull();
  });

  it("stays open when the pointer moves onto the card (hoverable)", async () => {
    vi.useFakeTimers();
    render(Fixture, { props: { openDelay: 0, closeDelay: 150 } });

    await fireEvent.pointerEnter(triggerWrap());
    await fireEvent.pointerLeave(triggerWrap()); // schedules a close in 150ms
    await fireEvent.pointerEnter(card()!); // cancels it
    vi.advanceTimersByTime(300);
    expect(card()).not.toBeNull();
  });

  it("closes when focus leaves the trigger and card", async () => {
    render(Fixture);
    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();

    await fireEvent.focusIn(screen.getByRole("link", { name: "after" }));
    expect(card()).toBeNull();
  });

  it("closes on Escape", async () => {
    render(Fixture);
    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();

    await fireEvent.keyDown(document, { key: "Escape" });
    expect(card()).toBeNull();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(Fixture);
    await fireEvent.pointerEnter(screen.getByRole("link", { name: "@ada" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
