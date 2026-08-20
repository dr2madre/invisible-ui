import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./notification-composition.fixture.svelte";
import { createNotifier } from "./notification/create-notifier";

// Composition contract E: a status message reaches the user once. The toast
// queue and a local message are separate channels, and the library must not
// add a second announcement of its own on either side.

const liveRegions = () =>
  [...document.querySelectorAll("[role='status'], [role='alert'], [aria-live]")] as HTMLElement[];

const carrying = (text: string) => liveRegions().filter((el) => el.textContent?.includes(text));

describe("Svelte notification composition", () => {
  it("wraps the queue in a landmark that is not itself a live region", async () => {
    const notifier = createNotifier();
    render(Fixture, { props: { notifier } });
    notifier.show({ title: "Saved", duration: 0, role: "status" });
    await screen.findByText("Saved");
    const region = screen.getByRole("region", { name: "Notifications" });
    // Only the notice announces; a live wrapper would announce every notice twice.
    expect(region).not.toHaveAttribute("aria-live");
    expect(carrying("Saved")).toHaveLength(1);
  });

  it("announces a repeated event once when it replaces in place", async () => {
    const notifier = createNotifier();
    render(Fixture, { props: { notifier } });
    notifier.show({ id: "save", title: "Saving…", duration: 0 });
    await screen.findByText("Saving…");
    notifier.show({ id: "save", title: "Saved", duration: 0 });
    await screen.findByText("Saved");
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
    expect(carrying("Saved")).toHaveLength(1);
  });

  it("keeps the local message and the toast as one channel each", async () => {
    const notifier = createNotifier();
    const { rerender } = render(Fixture, { props: { notifier, channel: "local" } });
    // Local channel: the field-level alert carries it, the queue stays empty.
    expect(carrying("Saving failed")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Notifications" }).textContent).toBe("");

    await rerender({ notifier, channel: "toast" });
    notifier.show({ title: "Saving failed", duration: 0, role: "alert" });
    await screen.findByText("Saving failed");
    // Toast channel: exactly one live region carries the same message.
    expect(carrying("Saving failed")).toHaveLength(1);
  });

  it("gives a composed view exactly one announcement surface", () => {
    const notifier = createNotifier();
    render(Fixture, { props: { notifier } });
    // The error view announces through its own alert, and nothing wraps the
    // composed area in a second live region.
    expect(carrying("Nothing loaded")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Nothing loaded" })).toBeVisible();
    const alert = carrying("Nothing loaded")[0]!;
    expect(alert.querySelectorAll("[role='status'], [role='alert'], [aria-live]")).toHaveLength(0);
  });
});
