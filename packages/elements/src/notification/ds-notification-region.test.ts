import { fireEvent, screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsLocaleProvider } from "../locale-provider/ds-locale-provider";
import type { DsNotification } from "./ds-notification";
import type { DsNotificationRegion } from "./ds-notification-region";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

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

// `duration="0"` turns the motion off, so additions and removals are immediate.
const mount = (attributes = 'duration="0"') => {
  document.body.innerHTML = `<ds-notification-region ${attributes}></ds-notification-region>`;
  return document.querySelector("ds-notification-region") as DsNotificationRegion;
};

const slots = () => Array.from(document.querySelectorAll<DsNotification>(".notice-slot"));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-notification-region>", () => {
  it("is a labelled region moved to the body, keeping the language around it", () => {
    document.body.innerHTML = `
      <div lang="it" dir="rtl"><ds-notification-region duration="0"></ds-notification-region></div>`;
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region.parentElement).toBe(document.body);
    expect(region).toHaveAttribute("lang", "it");
    expect(region).toHaveAttribute("dir", "rtl");
    expect(region).toHaveAttribute("data-placement", "top-end");
  });

  it("takes the region label and the close label from the provider", () => {
    document.body.innerHTML = `
      <ds-locale-provider locale="it"><ds-notification-region duration="0"></ds-notification-region></ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as DsLocaleProvider;
    const host = document.querySelector("ds-notification-region") as DsNotificationRegion;
    host.show({ title: "Salvato" });
    provider.messages = {
      "notificationRegion.label": "Notifiche",
      "inlineNotification.close": "Chiudi",
    };
    const region = screen.getByRole("region", { name: "Notifiche" });
    expect(within(region).getByRole("button", { name: "Chiudi" })).toBeInTheDocument();
    host.setAttribute("label", "Avvisi");
    expect(screen.getByRole("region", { name: "Avvisi" })).toBeInTheDocument();
  });

  it("renders queued notifications as live regions and removes them on dismiss", async () => {
    const host = mount();
    host.show({ title: "First", text: "one" });
    host.show({ title: "Second", text: "two", role: "alert" });
    expect(screen.getByRole("status", { name: "First" })).toHaveTextContent("one");
    expect(screen.getByRole("alert", { name: "Second" })).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[0]!);
    expect(screen.queryByText("First")).toBeNull();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("returns ids, reports every dismissal once with its reason", async () => {
    const host = mount();
    const onDismiss = vi.fn();
    const events: unknown[] = [];
    host.addEventListener("dismiss", (event) => events.push((event as CustomEvent).detail));
    const id = host.success("Saved", { onDismiss });
    expect(host.notifications).toEqual([
      expect.objectContaining({ id, status: "success", title: "Saved" }),
    ]);
    host.dismiss(id);
    host.dismiss(id);
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith("api");
    expect(events).toEqual([{ id, reason: "api" }]);

    const user = host.info("Hello", { onDismiss });
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onDismiss).toHaveBeenLastCalledWith("user");
    expect(events).toContainEqual({ id: user, reason: "user" });
  });

  it("replaces a live id in place and updates it", () => {
    const host = mount();
    host.show({ id: "save", title: "Saving…", closable: false });
    const first = slots()[0];
    host.show({ id: "save", title: "Saved", status: "success" });
    expect(slots()).toEqual([first]);
    expect(screen.getByRole("status", { name: "Saved" })).toBeInTheDocument();
    host.update("save", { closable: true });
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("clears the queue first, then tells every notification", () => {
    const host = mount();
    const seen: number[] = [];
    host.show({ title: "A", onDismiss: () => seen.push(host.notifications.length) });
    host.show({ title: "B", onDismiss: () => seen.push(host.notifications.length) });
    host.clear();
    expect(seen).toEqual([0, 0]);
    expect(slots()).toHaveLength(0);
  });

  it("runs an action, then dismisses with the action reason", async () => {
    const host = mount();
    const onClick = vi.fn();
    const onDismiss = vi.fn();
    host.show({ title: "Deleted", actions: [{ label: "Undo", onClick }], onDismiss });
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith("action");
    expect(slots()).toHaveLength(0);
  });

  it("swaps a promise notification from loading to the outcome", async () => {
    const host = mount();
    let resolve!: (value: string) => void;
    const done = host.promise(new Promise<string>((r) => (resolve = r)), {
      loading: "Uploading…",
      success: (name) => `${name} uploaded`,
      error: "Upload failed",
    });
    expect(screen.getByRole("status", { name: "Uploading…" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    resolve("photo.png");
    await done;
    expect(screen.getByRole("status", { name: "photo.png uploaded" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("does not remember every notification it has ever shown", () => {
    const host = mount();
    const slotOfNewest = () => Number(slots().at(-1)?.style.zIndex ?? "0");
    const id = host.show({ title: "First" });
    const first = slotOfNewest();
    host.dismiss(id, "user");
    for (let round = 0; round < 40; round += 1) {
      host.dismiss(host.show({ title: `Round ${round}` }), "user");
    }
    host.show({ title: "Last" });
    expect(first - slotOfNewest(), "the paint order drifted with the count").toBeLessThan(12);
  });

  it("keeps the newest visible: past max-visible the oldest leave", () => {
    const host = mount('duration="0" max-visible="2"');
    host.show({ title: "T1" });
    host.show({ title: "T2" });
    const t3 = host.show({ title: "T3" });
    expect(screen.getByText("T3")).toBeInTheDocument();
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.queryByText("T1")).toBeNull();
    // The oldest comes back in its place when a newer one goes.
    host.dismiss(t3);
    expect(slots().map((slot) => slot.getAttribute("title"))).toEqual(["T1", "T2"]);
  });

  it("swiping a notification far enough dismisses it (reduced motion, immediate)", () => {
    stubMotion(true);
    const host = mount("");
    const onDismiss = vi.fn();
    host.show({ title: "Swipe me", onDismiss });
    const slot = slots()[0]!;
    stubWidth(slot, 320);
    fireEvent(slot, pointer("pointerdown", 200, 0));
    fireEvent(window, pointer("pointermove", 260, 10));
    fireEvent(window, pointer("pointermove", 380, 20));
    fireEvent(window, pointer("pointerup", 380, 30));
    expect(screen.queryByText("Swipe me")).toBeNull();
    expect(onDismiss).toHaveBeenCalledWith("user");
  });

  it("keeps a swipe the user finished when the region goes away mid-animation", () => {
    stubMotion(false);
    const host = mount("");
    const id = host.show({ title: "Swipe me" });
    const slot = slots()[0]!;
    stubWidth(slot, 320);
    fireEvent(slot, pointer("pointerdown", 200, 0));
    fireEvent(window, pointer("pointermove", 260, 10));
    fireEvent(window, pointer("pointermove", 380, 20));
    fireEvent(window, pointer("pointerup", 380, 30));
    host.remove();
    expect(host.notifications.some((notice) => notice.id === id)).toBe(false);
  });

  it("a small swipe or a disabled swipe does not dismiss", () => {
    const host = mount('duration="0" swipeable="false"');
    host.show({ title: "Fixed" });
    let slot = slots()[0]!;
    stubWidth(slot, 320);
    fireEvent(slot, pointer("pointerdown", 200, 0));
    fireEvent(window, pointer("pointermove", 400, 10));
    fireEvent(window, pointer("pointerup", 400, 20));
    expect(screen.getByText("Fixed")).toBeInTheDocument();

    host.removeAttribute("swipeable");
    slot = slots()[0]!;
    fireEvent(slot, pointer("pointerdown", 200, 0));
    fireEvent(window, pointer("pointermove", 214, 200));
    fireEvent(window, pointer("pointerup", 214, 400));
    expect(screen.getByText("Fixed")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const host = mount();
    host.show({ title: "Saved", text: "x", actions: [{ label: "Undo" }] });
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });

  describe("motion", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("animates a leaving notification out, inert, before removing it", () => {
      stubMotion(false);
      const host = mount("");
      const id = host.show({ title: "Leaving" });
      const slot = slots()[0]!;
      expect(slot).toHaveClass("notice-enter-active");
      host.dismiss(id);
      expect(slot).toHaveClass("notice-leave-active");
      expect(slot.inert).toBe(true);
      expect(slot.isConnected).toBe(true);
      vi.advanceTimersByTime(400);
      expect(slot.isConnected).toBe(false);
    });

    it("adds and removes at once under reduced motion", () => {
      stubMotion(true);
      const host = mount("");
      const id = host.show({ title: "Still" });
      const slot = slots()[0]!;
      expect(slot.className).toBe("notice-slot");
      host.dismiss(id);
      expect(slot.isConnected).toBe(false);
    });
  });

  describe("timing", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("auto-dismisses with the timeout reason", () => {
      const host = mount();
      const onDismiss = vi.fn();
      host.show({ title: "Hi", duration: 1000, onDismiss });
      vi.advanceTimersByTime(1000);
      expect(onDismiss).toHaveBeenCalledWith("timeout");
      expect(slots()).toHaveLength(0);
    });

    it("holds every countdown while the stack is hovered or holds focus", () => {
      const host = mount();
      const onDismiss = vi.fn();
      host.show({ title: "A", duration: 1000, onDismiss });
      host.show({ title: "B", duration: 1000, onDismiss });
      const [first] = slots();
      fireEvent.pointerOver(first!);
      vi.advanceTimersByTime(5000);
      expect(onDismiss).not.toHaveBeenCalled();
      fireEvent.pointerOut(first!, { relatedTarget: document.body });
      within(first!).getByRole("button", { name: "Close" }).focus();
      vi.advanceTimersByTime(5000);
      expect(onDismiss).toHaveBeenCalledTimes(0);
      (document.activeElement as HTMLElement).blur();
      vi.advanceTimersByTime(1000);
      expect(onDismiss).toHaveBeenCalledTimes(2);
    });

    it("releases the pause when the focused notification is dismissed", () => {
      const host = mount();
      const onDismiss = vi.fn();
      host.show({ title: "Stay", duration: 1000, onDismiss });
      const closing = host.show({ title: "Go" });
      const go = slots().find((slot) => slot.getAttribute("title") === "Go")!;
      within(go).getByRole("button", { name: "Close" }).focus();
      host.dismiss(closing, "user");
      vi.advanceTimersByTime(1000);
      expect(onDismiss).toHaveBeenCalledWith("timeout");
    });
  });
});
