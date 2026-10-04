import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorState } from "./error-state/ErrorState";
import { InlineNotification } from "./inline-notification/InlineNotification";
import { createNotifier, type Notifier } from "./notification/create-notifier";
import { NotificationRegion } from "./notification/NotificationRegion";

// Composition contract E: a status message reaches the user once. The toast
// queue and a local message are separate channels, and the library adds no
// second announcement of its own on either side.

const liveRegions = () =>
  [...document.querySelectorAll("[role='status'], [role='alert'], [aria-live]")] as HTMLElement[];
const carrying = (text: string) => liveRegions().filter((el) => el.textContent?.includes(text));

function Composed({
  notifier,
  channel = "none",
}: {
  notifier: Notifier;
  /** The application routes one event to one channel: local text or a toast. */
  channel?: "none" | "local" | "toast";
}) {
  return (
    <div>
      {channel === "local" ? (
        <InlineNotification
          status="danger"
          role="alert"
          title="Saving failed"
          description="Try again in a moment."
        />
      ) : channel === "none" ? (
        <ErrorState title="Nothing loaded" description="No request has run yet." />
      ) : null}
      <NotificationRegion notifier={notifier} duration={0} />
    </div>
  );
}

describe("React notification composition", () => {
  it("wraps the queue in a landmark that is not itself a live region", () => {
    const notifier = createNotifier();
    render(<Composed notifier={notifier} />);
    act(() => {
      notifier.show({ title: "Saved", role: "status" });
    });
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region).not.toHaveAttribute("aria-live");
    expect(carrying("Saved")).toHaveLength(1);
  });

  it("announces a repeated event once when it replaces in place", () => {
    const notifier = createNotifier();
    render(<Composed notifier={notifier} />);
    act(() => {
      notifier.show({ id: "save", title: "Saving…" });
    });
    act(() => {
      notifier.show({ id: "save", title: "Saved" });
    });
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
    expect(carrying("Saved")).toHaveLength(1);
  });

  it("keeps the local message and the toast as one channel each", () => {
    const notifier = createNotifier();
    const { rerender } = render(<Composed notifier={notifier} channel="local" />);
    expect(carrying("Saving failed")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Notifications" }).textContent).toBe("");

    rerender(<Composed notifier={notifier} channel="toast" />);
    act(() => {
      notifier.show({ title: "Saving failed", role: "alert" });
    });
    expect(carrying("Saving failed")).toHaveLength(1);
  });

  it("gives a composed view exactly one announcement surface", () => {
    render(<Composed notifier={createNotifier()} />);
    expect(carrying("Nothing loaded")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Nothing loaded" })).toBeVisible();
    const alert = carrying("Nothing loaded")[0]!;
    expect(alert.querySelectorAll("[role='status'], [role='alert'], [aria-live]")).toHaveLength(0);
  });
});
