import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { createNotifier } from "./create-notifier";
import { NotificationRegion } from "./NotificationRegion";

/** A pointer-ish event (jsdom lacks a reliable PointerEvent constructor). */
function pointer(type: string, x: number, timeStamp?: number) {
  const event = new MouseEvent(type, { clientX: x, clientY: 40, button: 0, bubbles: true });
  Object.defineProperty(event, "pointerId", { value: 1 });
  if (timeStamp !== undefined) Object.defineProperty(event, "timeStamp", { value: timeStamp });
  return event;
}
const stubWidth = (el: HTMLElement, value: number) =>
  Object.defineProperty(el, "offsetWidth", { configurable: true, value });

/** A reduced-motion preference whose value the test can change. */
const stubMotion = (initial: boolean) => {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }));
  return {
    listeners,
    set(next: boolean) {
      matches = next;
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
};

const region = () => screen.getByRole("region", { name: "Notifications" });
const slots = () => [...document.querySelectorAll<HTMLElement>(".notice-slot")];

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("React NotificationRegion", () => {
  it("is a labelled region mounted in <body>, not a live region itself", () => {
    const { container } = render(<NotificationRegion notifier={createNotifier()} duration={0} />);
    expect(region().parentElement).toBe(document.body);
    expect(container).not.toContainElement(region());
    expect(region()).not.toHaveAttribute("aria-live");
    expect(region()).toHaveAttribute("data-placement", "top-end");
  });

  it("takes its name, language and direction from the locale", () => {
    render(
      <LocaleProvider locale="ar" messages={{ "notificationRegion.label": "Avvisi" }}>
        <NotificationRegion notifier={createNotifier()} placement="bottom-start" duration={0} />
      </LocaleProvider>,
    );
    const el = screen.getByRole("region", { name: "Avvisi" });
    expect(el).toHaveAttribute("lang", "ar");
    expect(el).toHaveAttribute("dir", "rtl");
    expect(el).toHaveAttribute("data-placement", "bottom-start");
  });

  it("renders queued notifications, each its own live region, and removes them on dismiss", async () => {
    const notifier = createNotifier();
    render(<NotificationRegion notifier={notifier} duration={0} />);
    act(() => {
      notifier.show({ title: "First", text: "one" });
      notifier.show({ title: "Second", text: "two", role: "alert" });
    });
    expect(within(region()).getByRole("status", { name: "First" })).toBeInTheDocument();
    expect(within(region()).getByRole("alert", { name: "Second" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getAllByRole("button", { name: "Close" })[0]!);
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(notifier.getSnapshot().map((n) => n.title)).toEqual(["Second"]);
  });

  it("dismisses through the notifier with the reason", () => {
    const notifier = createNotifier();
    const onDismiss = vi.fn();
    render(<NotificationRegion notifier={notifier} duration={0} />);
    act(() => {
      notifier.show({ title: "Deleted", actions: [{ label: "Undo" }], onDismiss });
    });
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith("action");
  });

  it("sets the inset and the motion durations, and follows the reduced motion setting", () => {
    const motion = stubMotion(false);
    const { unmount } = render(
      <NotificationRegion notifier={createNotifier()} duration={200} inset="2rem" />,
    );
    expect(region().style.padding).toBe("2rem");
    expect(region().style.getPropertyValue("--_notice-motion")).toBe("200ms");
    expect(region().style.getPropertyValue("--_notice-motion-out")).toBe("350ms");

    motion.set(true);
    expect(region().style.getPropertyValue("--_notice-motion")).toBe("0ms");
    expect(region().style.getPropertyValue("--_notice-motion-out")).toBe("0ms");

    unmount();
    expect(motion.listeners.size).toBe(0);
  });

  it("enters, and keeps a leaving notification in place until it has animated out", () => {
    stubMotion(false);
    vi.useFakeTimers();
    const notifier = createNotifier();
    render(<NotificationRegion notifier={notifier} duration={100} exitDuration={200} />);
    let id = "";
    act(() => {
      id = notifier.show({ title: "Moving" });
    });
    const slot = slots()[0]!;
    expect(slot).toHaveClass("notice-slot", "notice-enter-from", "notice-enter-active");
    act(() => vi.advanceTimersByTime(50));
    expect(slot).not.toHaveClass("notice-enter-from");
    act(() => vi.advanceTimersByTime(200));
    expect(slot.className).toBe("notice-slot");

    act(() => notifier.dismiss(id, "user"));
    // Still there, inert, on its way out.
    expect(slot).toBeInTheDocument();
    expect(slot.inert).toBe(true);
    expect(slot).toHaveClass("notice-leave-active");
    act(() => vi.advanceTimersByTime(260));
    expect(slot).not.toBeInTheDocument();
  });

  it("gives older notifications the higher paint order", () => {
    const notifier = createNotifier();
    render(<NotificationRegion notifier={notifier} duration={0} />);
    act(() => {
      notifier.show({ title: "Old" });
      notifier.show({ title: "New" });
    });
    const [older, newer] = slots().map((slot) => Number(slot.style.zIndex));
    expect(older).toBeGreaterThan(newer!);
  });

  it("keeps the newest visible: past maxVisible the oldest leave", () => {
    const notifier = createNotifier();
    render(<NotificationRegion notifier={notifier} duration={0} maxVisible={2} />);
    act(() => {
      notifier.show({ title: "T1" });
      notifier.show({ title: "T2" });
      notifier.show({ title: "T3" });
    });
    expect(screen.getByText("T3")).toBeInTheDocument();
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.queryByText("T1")).not.toBeInTheDocument();
  });

  it("pauses every countdown while the stack is hovered or focused", () => {
    vi.useFakeTimers();
    const notifier = createNotifier();
    const onDismiss = vi.fn();
    render(<NotificationRegion notifier={notifier} duration={0} />);
    act(() => {
      notifier.show({ title: "A", duration: 1000, onDismiss });
      notifier.show({ title: "B", duration: 1000, onDismiss });
    });
    fireEvent.pointerOver(slots()[1]!);
    act(() => vi.advanceTimersByTime(5000));
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.pointerOut(slots()[1]!, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(1000));
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("swiping a notification far enough dismisses it (reduced motion: at once)", () => {
    stubMotion(true);
    const notifier = createNotifier();
    render(<NotificationRegion notifier={notifier} duration={0} />);
    act(() => {
      notifier.show({ title: "Swipe me" });
    });
    const slot = slots()[0]!;
    stubWidth(slot, 320);

    fireEvent(slot, pointer("pointerdown", 200, 0));
    fireEvent(window, pointer("pointermove", 260, 10));
    fireEvent(window, pointer("pointermove", 380, 20));
    act(() => {
      fireEvent(window, pointer("pointerup", 380, 30));
    });
    expect(screen.queryByText("Swipe me")).not.toBeInTheDocument();
  });

  it("a small swipe does not dismiss", () => {
    const notifier = createNotifier();
    render(<NotificationRegion notifier={notifier} duration={0} />);
    act(() => {
      notifier.show({ title: "Stay" });
    });
    const slot = slots()[0]!;
    stubWidth(slot, 320);
    fireEvent(slot, pointer("pointerdown", 200, 0));
    fireEvent(window, pointer("pointermove", 214, 200));
    fireEvent(window, pointer("pointerup", 214, 400));
    expect(screen.getByText("Stay")).toBeInTheDocument();
  });

  it("swipe can be turned off with swipeable={false}", () => {
    stubMotion(true);
    const notifier = createNotifier();
    render(<NotificationRegion notifier={notifier} duration={0} swipeable={false} />);
    act(() => {
      notifier.show({ title: "Fixed" });
    });
    const slot = slots()[0]!;
    stubWidth(slot, 320);
    fireEvent(slot, pointer("pointerdown", 200, 0));
    fireEvent(window, pointer("pointermove", 400, 10));
    act(() => {
      fireEvent(window, pointer("pointerup", 400, 20));
    });
    expect(screen.getByText("Fixed")).toBeInTheDocument();
  });

  it("leaves no timer behind when it goes", () => {
    stubMotion(false);
    vi.useFakeTimers();
    const notifier = createNotifier();
    const { unmount } = render(<NotificationRegion notifier={notifier} duration={100} />);
    let id = "";
    act(() => {
      id = notifier.show({ title: "Gone" });
    });
    act(() => notifier.dismiss(id));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("has no accessibility violations with notifications shown", async () => {
    const notifier = createNotifier();
    render(<NotificationRegion notifier={notifier} duration={0} />);
    act(() => {
      notifier.show({ title: "Saved", text: "All good" });
    });
    await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument());
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
