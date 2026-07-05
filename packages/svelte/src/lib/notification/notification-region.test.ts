import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createNotifier } from "./create-notifier";
import NotificationRegion from "./NotificationRegion.svelte";

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

  it("limits visible notices and reveals queued ones as space frees", async () => {
    const notifier = createNotifier();
    render(NotificationRegion, { props: { notifier, duration: 0, maxVisible: 2 } });

    notifier.show({ title: "T1", duration: 0 });
    notifier.show({ title: "T2", duration: 0 });
    notifier.show({ title: "T3", duration: 0 });

    expect(await screen.findByText("T1")).toBeInTheDocument();
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.queryByText("T3")).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(screen.queryByText("T1")).not.toBeInTheDocument();
    expect(await screen.findByText("T3")).toBeInTheDocument();
  });
});
