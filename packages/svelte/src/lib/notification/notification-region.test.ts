import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createNotifier } from "./create-notifier";
import NotificationRegion from "./NotificationRegion.svelte";

/** A pointer-ish event (jsdom lacks a reliable PointerEvent constructor). */
function pointer(type: string, x: number, timeStamp?: number) {
  const event = new MouseEvent(type, { clientX: x, clientY: 40, button: 0, bubbles: true });
  Object.defineProperty(event, "pointerId", { value: 1 });
  if (timeStamp !== undefined) Object.defineProperty(event, "timeStamp", { value: timeStamp });
  return event;
}
const stubWidth = (el: HTMLElement, value: number) =>
  Object.defineProperty(el, "offsetWidth", { configurable: true, value });

describe("NotificationRegion", () => {
  it("is a labelled region", () => {
    const notifier = createNotifier();
    render(NotificationRegion, { props: { notifier, duration: 0 } });
    expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();
  });

  it("renders queued notices and removes them on dismiss", async () => {
    const notifier = createNotifier();
    render(NotificationRegion, { props: { notifier, duration: 0 } });

    notifier.show({ title: "First", text: "one", duration: 0 });
    notifier.show({ title: "Second", text: "two", duration: 0 });
    expect(await screen.findByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("keeps the newest visible: past maxVisible the oldest leave", async () => {
    const notifier = createNotifier();
    render(NotificationRegion, { props: { notifier, duration: 0, maxVisible: 2 } });

    notifier.show({ title: "T1", duration: 0 });
    notifier.show({ title: "T2", duration: 0 });
    notifier.show({ title: "T3", duration: 0 });

    // The new notification always enters; the oldest drops off.
    expect(await screen.findByText("T3")).toBeInTheDocument();
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.queryByText("T1")).not.toBeInTheDocument();
  });

  it("swiping a notification far enough dismisses it (reduced motion → immediate)", async () => {
    const notifier = createNotifier();
    // Reduced motion so the dismiss fires synchronously (no exit transition).
    window.matchMedia = ((q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent() {
        return false;
      },
    })) as unknown as typeof window.matchMedia;

    render(NotificationRegion, { props: { notifier, duration: 0 } });
    notifier.show({ title: "Swipe me", duration: 0 });
    await screen.findByText("Swipe me");
    const slot = document.querySelector<HTMLElement>(".notice-slot")!;
    stubWidth(slot, 320);

    await fireEvent(slot, pointer("pointerdown", 200, 0));
    await fireEvent(window, pointer("pointermove", 260, 10)); // arm (past 8px)
    await fireEvent(window, pointer("pointermove", 380, 20)); // 180px > 35%·320
    await fireEvent(window, pointer("pointerup", 380, 30));

    expect(screen.queryByText("Swipe me")).not.toBeInTheDocument();
  });

  it("a small swipe does not dismiss (stays under the threshold)", async () => {
    const notifier = createNotifier();
    render(NotificationRegion, { props: { notifier, duration: 0 } });
    notifier.show({ title: "Stay", duration: 0 });
    await screen.findByText("Stay");
    const slot = document.querySelector<HTMLElement>(".notice-slot")!;
    stubWidth(slot, 320);

    await fireEvent(slot, pointer("pointerdown", 200, 0));
    await fireEvent(window, pointer("pointermove", 214, 200)); // 14px over 200ms → slow (0.07px/ms)
    await fireEvent(window, pointer("pointerup", 214, 400));

    expect(screen.getByText("Stay")).toBeInTheDocument();
  });

  it("swipe can be turned off with swipeable=false", async () => {
    const notifier = createNotifier();
    render(NotificationRegion, { props: { notifier, duration: 0, swipeable: false } });
    notifier.show({ title: "Fixed", duration: 0 });
    await screen.findByText("Fixed");
    const slot = document.querySelector<HTMLElement>(".notice-slot")!;
    stubWidth(slot, 320);

    await fireEvent(slot, pointer("pointerdown", 200, 0));
    await fireEvent(window, pointer("pointermove", 400, 10));
    await fireEvent(window, pointer("pointerup", 400, 20));

    expect(screen.getByText("Fixed")).toBeInTheDocument();
  });
});
