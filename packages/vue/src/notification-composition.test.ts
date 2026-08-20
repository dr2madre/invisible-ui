import { render, screen } from "@testing-library/vue";
import { defineComponent, h, type PropType } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { ErrorState } from "./error-state/ErrorState";
import { InlineNotification } from "./inline-notification/InlineNotification";
import { createNotifier, type Notifier } from "./notification/create-notifier";
import { NotificationRegion } from "./notification/NotificationRegion";

// Composition contract E: a status message reaches the user once. The toast
// queue and a local message are separate channels, and the library must not
// add a second announcement of its own on either side.

const stubMatchMedia = () => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  })) as unknown as typeof window.matchMedia;
};

const Fixture = defineComponent({
  props: {
    notifier: { type: Object as PropType<Notifier>, required: true },
    channel: { type: String as PropType<"none" | "local" | "toast">, default: "none" },
    message: { type: String, default: "Saving failed" },
  },
  setup(props) {
    return () =>
      h("div", [
        props.channel === "local"
          ? h(InlineNotification, {
              status: "danger",
              role: "alert",
              title: props.message,
              description: "Try again in a moment.",
            })
          : props.channel === "none"
            ? h(ErrorState, {
                title: "Nothing loaded",
                description: "No request has run yet.",
              })
            : null,
        h(NotificationRegion, { notifier: props.notifier, duration: 0 }),
      ]);
  },
});

const liveRegions = () =>
  [...document.querySelectorAll("[role='status'], [role='alert'], [aria-live]")] as HTMLElement[];

const carrying = (text: string) => liveRegions().filter((el) => el.textContent?.includes(text));

describe("Vue notification composition", () => {
  beforeEach(stubMatchMedia);

  it("wraps the queue in a landmark that is not itself a live region", async () => {
    const notifier = createNotifier();
    render(Fixture, { props: { notifier } });
    notifier.show({ title: "Saved", duration: 0, role: "status" });
    await screen.findByText("Saved");
    const region = screen.getByRole("region", { name: "Notifications" });
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
    expect(carrying("Saving failed")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Notifications" }).textContent).toBe("");

    await rerender({ notifier, channel: "toast" });
    notifier.show({ title: "Saving failed", duration: 0, role: "alert" });
    await screen.findByText("Saving failed");
    expect(carrying("Saving failed")).toHaveLength(1);
  });

  it("gives a composed view exactly one announcement surface", () => {
    const notifier = createNotifier();
    render(Fixture, { props: { notifier } });
    expect(carrying("Nothing loaded")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Nothing loaded" })).toBeVisible();
    const alert = carrying("Nothing loaded")[0]!;
    expect(alert.querySelectorAll("[role='status'], [role='alert'], [aria-live]")).toHaveLength(0);
  });
});
