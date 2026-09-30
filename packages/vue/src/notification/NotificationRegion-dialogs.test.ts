import { render, screen, waitFor, within } from "@testing-library/vue";
import { defineComponent, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../dialog/Dialog";
import { createNotifier, type Notifier } from "./create-notifier";
import { NotificationRegion } from "./NotificationRegion";

// The notification region while a modal dialog is open (ADR 0016).

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** The render, the dialog's showModal(), the observer's report, the render. */
const settle = async () => {
  for (let tick = 0; tick < 4; tick++) {
    await nextTick();
    await Promise.resolve();
  }
};

const slots = () => [...document.querySelectorAll<HTMLElement>(".notice-slot")];
const titles = () =>
  slots().map((slot) => slot.querySelector(".inline-notification__title")?.textContent);

/** A dialog and a region side by side, or the region inside the dialog. */
const mountWithDialog = (notifier: Notifier, { regionInside = false } = {}) => {
  const open = ref(false);
  const region = () => h(NotificationRegion, { notifier, duration: 0 });
  render(
    defineComponent({
      setup: () => () => [
        h(
          Dialog,
          {
            title: "Upload",
            trigger: "Open",
            open: open.value,
            "onUpdate:open": (next: boolean) => (open.value = next),
          },
          { default: () => [h("p", "Body"), regionInside ? region() : null] },
        ),
        regionInside ? null : region(),
      ],
    }),
  );
  const setOpen = async (next: boolean) => {
    open.value = next;
    await settle();
  };
  return { setOpen };
};

describe("Vue NotificationRegion while a modal dialog is open", () => {
  it("holds new notifications, then shows them in order after the dialog closes", async () => {
    const notifier = createNotifier();
    const { setOpen } = mountWithDialog(notifier);
    await settle();
    await setOpen(true);
    notifier.info("First");
    notifier.info("Second");
    await settle();
    expect(slots()).toHaveLength(0);
    expect(notifier.notifications.value.map((item) => item.title)).toEqual(["First", "Second"]);

    await setOpen(false);
    expect(titles()).toEqual(["First", "Second"]);
  });

  it("never mounts the region inside the dialog, even when placed in it", async () => {
    const notifier = createNotifier();
    const { setOpen } = mountWithDialog(notifier, { regionInside: true });
    await setOpen(true);
    notifier.success("Uploaded");
    await settle();
    const panel = screen.getByRole("dialog");
    const region = screen.getByRole("region", { name: "Notifications" });
    // Teleported inside the wrapper that carries its language and direction.
    expect(region.parentElement!.parentElement).toBe(document.body);
    expect(panel).not.toContainElement(region);
    expect(screen.queryByText("Uploaded")).toBeNull();
  });

  it("announces a held notification only once it is shown", async () => {
    const notifier = createNotifier();
    const { setOpen } = mountWithDialog(notifier);
    await settle();
    const region = screen.getByRole("region", { name: "Notifications" });
    await setOpen(true);
    notifier.info("Report ready");
    await settle();
    // Each notification is its own live region: held, there is none to speak.
    expect(within(region).queryByRole("status")).toBeNull();

    await setOpen(false);
    await waitFor(() =>
      expect(within(region).getByRole("status", { name: "Report ready" })).toBeInTheDocument(),
    );
  });

  it("keeps a shown notification as it was, and shows its change after the dialog closes", async () => {
    const notifier = createNotifier();
    const { setOpen } = mountWithDialog(notifier);
    await settle();
    const id = notifier.info("Saving");
    await settle();
    await setOpen(true);
    notifier.update(id, { title: "Saved" });
    await settle();
    expect(titles()).toEqual(["Saving"]);

    await setOpen(false);
    expect(titles()).toEqual(["Saved"]);
  });

  it("waits for every stacked modal, and for a modal opened outside the package", async () => {
    const notifier = createNotifier();
    const { setOpen } = mountWithDialog(notifier);
    await settle();
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
    await setOpen(true);
    native.showModal();
    await settle();
    notifier.info("Later");

    await setOpen(false);
    expect(slots()).toHaveLength(0);

    native.close();
    await settle();
    expect(slots()).toHaveLength(1);
    native.remove();
  });

  it("starts a held countdown only when the notification is shown", async () => {
    vi.useFakeTimers();
    const notifier = createNotifier();
    const onDismiss = vi.fn();
    const { setOpen } = mountWithDialog(notifier);
    await settle();
    await setOpen(true);
    notifier.show({ title: "Held", duration: 1000, onDismiss });
    await settle();
    vi.advanceTimersByTime(5000);
    expect(onDismiss).not.toHaveBeenCalled();

    await setOpen(false);
    expect(slots()).toHaveLength(1);
    vi.advanceTimersByTime(999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledWith("timeout");
  });

  it("holds the countdown of a shown notification while a modal is open", async () => {
    vi.useFakeTimers();
    const notifier = createNotifier();
    const onDismiss = vi.fn();
    const { setOpen } = mountWithDialog(notifier);
    await settle();
    notifier.show({ title: "Shown", duration: 1000, onDismiss });
    await settle();
    vi.advanceTimersByTime(400);
    await setOpen(true);
    // It stays where it was, behind the dialog, and its time stands still.
    expect(slots()).toHaveLength(1);
    vi.advanceTimersByTime(5000);
    expect(onDismiss).not.toHaveBeenCalled();

    await setOpen(false);
    vi.advanceTimersByTime(600);
    expect(onDismiss).toHaveBeenCalledWith("timeout");
  });

  it("shows nothing it holds when mounted while a modal is open", async () => {
    const notifier = createNotifier();
    notifier.info("Queued early");
    const native = document.createElement("dialog");
    document.body.append(native);
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (
      this: Element,
      selector: string,
    ) {
      if (selector === ":modal") return this === native && native.hasAttribute("open");
      return matches.call(this, selector);
    });
    native.showModal();
    render(NotificationRegion, { props: { notifier, duration: 0 } });
    await settle();
    expect(slots()).toHaveLength(0);

    native.close();
    await settle();
    expect(titles()).toEqual(["Queued early"]);
    native.remove();
  });
});
