import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { tick } from "svelte";
import { get } from "svelte/store";
import { createNotifier } from "./create-notifier";
import NotificationRegion from "./NotificationRegion.svelte";
import DialogFixture from "./notification-region-dialog.fixture.svelte";

/** A pointer-ish event (jsdom lacks a reliable PointerEvent constructor). */
function pointer(type: string, x: number, timeStamp?: number) {
  const event = new MouseEvent(type, { clientX: x, clientY: 40, button: 0, bubbles: true });
  Object.defineProperty(event, "pointerId", { value: 1 });
  if (timeStamp !== undefined) Object.defineProperty(event, "timeStamp", { value: timeStamp });
  return event;
}
const stubWidth = (el: HTMLElement, value: number) =>
  Object.defineProperty(el, "offsetWidth", { configurable: true, value });

const stubMotion = (reduce: boolean) => {
  window.matchMedia = ((q: string) => ({
    matches: reduce && q.includes("reduce"),
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
};

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
    await user.click(screen.getAllByRole("button", { name: "Close" })[0]!);
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("follows the reduced motion setting when it changes after mount", async () => {
    let matches = false;
    const listeners = new Set<() => void>();
    window.matchMedia = ((q: string) => ({
      get matches() {
        return matches;
      },
      media: q,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    })) as unknown as typeof window.matchMedia;

    const notifier = createNotifier();
    render(NotificationRegion, { props: { notifier, duration: 200 } });
    matches = true;
    for (const listener of listeners) listener();

    const id = notifier.show({ title: "Saved", duration: 0 });
    await screen.findByText("Saved");
    notifier.dismiss(id, "user");
    await tick();
    // Reduced motion leaves at once; the default exit would still be running.
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("does not remember every notification it has ever shown", async () => {
    const notifier = createNotifier();
    render(NotificationRegion, { props: { notifier, duration: 0 } });

    // A region lives as long as the app around it. Paint order is assigned per
    // notification, so a region that never forgets keeps counting: the slot of
    // a fresh notification drifts one step lower every time.
    const slotOfNewest = () => {
      const slots = document.querySelectorAll<HTMLElement>(".notice-slot");
      return Number(slots[slots.length - 1]?.style.zIndex ?? "0");
    };

    const id = notifier.show({ title: "First", text: "one", duration: 0 });
    await screen.findByText("First");
    const first = slotOfNewest();
    notifier.dismiss(id, "user");

    for (let round = 0; round < 40; round += 1) {
      const next = notifier.show({ title: `Round ${round}`, text: "x", duration: 0 });
      await screen.findByText(`Round ${round}`);
      notifier.dismiss(next, "user");
    }

    const last = notifier.show({ title: "Last", text: "z", duration: 0 });
    await screen.findByText("Last");
    expect(first - slotOfNewest(), "the paint order drifted with the count").toBeLessThan(12);
    notifier.dismiss(last, "user");
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
    stubMotion(true);

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

  it("keeps a swipe the user finished when the region goes away mid-animation", async () => {
    const notifier = createNotifier();
    // Real motion this time: the dismissal waits for the exit animation, which
    // is exactly the window in which the region can be taken away. Stated
    // here because another test in this file prefers reduced motion.
    stubMotion(false);
    const { unmount } = render(NotificationRegion, { props: { notifier, duration: 0 } });
    const id = notifier.show({ title: "Swipe me", duration: 0 });
    await screen.findByText("Swipe me");
    const slot = document.querySelector<HTMLElement>(".notice-slot")!;
    stubWidth(slot, 320);

    await fireEvent(slot, pointer("pointerdown", 200, 0));
    await fireEvent(window, pointer("pointermove", 260, 10));
    await fireEvent(window, pointer("pointermove", 380, 20));
    await fireEvent(window, pointer("pointerup", 380, 30));
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 260));

    const left = get(notifier);
    expect(
      left.some((notice) => notice.id === id),
      "the user asked for it to go, so it must be gone from the queue",
    ).toBe(false);
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

  describe("while a modal dialog is open (ADR 0016)", () => {
    // The observer that follows dialogs reports in a microtask; Svelte then
    // renders.
    const settle = async () => {
      for (let step = 0; step < 3; step++) await Promise.resolve();
      await tick();
    };
    const slots = () => [...document.querySelectorAll<HTMLElement>(".notice-slot")];
    const titles = () =>
      slots().map((slot) => slot.querySelector(".inline-notification__title")?.textContent);
    const mountWithDialog = (inside = false) => {
      const notifier = createNotifier();
      const dialog = render(DialogFixture, { props: { notifier, inside } }).component;
      return { notifier, dialog };
    };

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("holds new notifications, then shows them in order after the dialog closes", async () => {
      const { notifier, dialog } = mountWithDialog();
      dialog.setOpen(true);
      await settle();
      notifier.info("First");
      notifier.info("Second");
      await settle();
      expect(slots()).toHaveLength(0);
      expect(get(notifier).map((item) => item.title)).toEqual(["First", "Second"]);

      dialog.setOpen(false);
      await settle();
      expect(titles()).toEqual(["First", "Second"]);
    });

    it("never mounts the region inside the dialog, even when placed in it", async () => {
      const { notifier, dialog } = mountWithDialog(true);
      dialog.setOpen(true);
      await settle();
      notifier.success("Uploaded");
      await settle();
      const panel = screen.getByRole("dialog");
      const region = screen.getByRole("region", { name: "Notifications" });
      expect(region.parentElement).toBe(document.body);
      expect(panel).not.toContainElement(region);
      expect(screen.queryByText("Uploaded")).toBeNull();
    });

    it("keeps a shown notification as it was, and shows a change after the dialog closes", async () => {
      const { notifier, dialog } = mountWithDialog();
      const id = notifier.info("Uploading");
      await settle();
      dialog.setOpen(true);
      await settle();
      notifier.update(id, { status: "success", title: "Uploaded" });
      await settle();
      // It stays where it was, and its live region says nothing new yet.
      expect(titles()).toEqual(["Uploading"]);

      dialog.setOpen(false);
      await settle();
      expect(titles()).toEqual(["Uploaded"]);
    });

    it("waits for a modal opened outside the package", async () => {
      const { notifier } = mountWithDialog();
      const native = document.createElement("dialog");
      document.body.append(native);
      // jsdom never matches :modal; a browser does for a showModal() dialog.
      const matches = Element.prototype.matches;
      vi.spyOn(Element.prototype, "matches").mockImplementation(function (
        this: Element,
        selector: string,
      ) {
        if (selector === ":modal") return this === native && native.hasAttribute("open");
        return matches.call(this, selector);
      });
      native.showModal();
      await settle();
      notifier.info("Later");
      await settle();
      expect(slots()).toHaveLength(0);

      native.close();
      await settle();
      expect(slots()).toHaveLength(1);
      native.remove();
    });

    it("starts a held countdown only when the notification is shown", async () => {
      vi.useFakeTimers();
      const { notifier, dialog } = mountWithDialog();
      const onDismiss = vi.fn();
      dialog.setOpen(true);
      await settle();
      notifier.show({ title: "Held", duration: 1000, onDismiss });
      await settle();
      vi.advanceTimersByTime(5000);
      expect(onDismiss).not.toHaveBeenCalled();

      dialog.setOpen(false);
      await settle();
      expect(slots()).toHaveLength(1);
      vi.advanceTimersByTime(999);
      expect(onDismiss).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onDismiss).toHaveBeenCalledWith("timeout");
    });

    it("holds the countdown of a shown notification while a modal is open", async () => {
      vi.useFakeTimers();
      const { notifier, dialog } = mountWithDialog();
      const onDismiss = vi.fn();
      notifier.show({ title: "Shown", duration: 1000, onDismiss });
      await settle();
      vi.advanceTimersByTime(400);
      dialog.setOpen(true);
      await settle();
      expect(slots()).toHaveLength(1);
      vi.advanceTimersByTime(5000);
      expect(onDismiss).not.toHaveBeenCalled();

      dialog.setOpen(false);
      await settle();
      vi.advanceTimersByTime(600);
      expect(onDismiss).toHaveBeenCalledWith("timeout");
    });
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
