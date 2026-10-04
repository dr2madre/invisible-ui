import { act, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../dialog/Dialog";
import { createNotifier, type Notifier } from "./create-notifier";
import { NotificationRegion } from "./NotificationRegion";

// The notification region while a modal dialog is open (ADR 0016, case 2).

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.style.overflow = "";
});

/** The commit, the dialog's showModal(), the observer's report, the render. */
const settle = async () => {
  await act(async () => {
    for (let tick = 0; tick < 4; tick++) await Promise.resolve();
  });
};

const slots = () => [...document.querySelectorAll<HTMLElement>(".notice-slot")];
const titles = () =>
  slots().map((slot) => slot.querySelector(".inline-notification__title")?.textContent);

/** jsdom never matches :modal; a browser does for a showModal() dialog. */
const matchModal = (dialog: HTMLDialogElement) => {
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    if (selector === ":modal") return this === dialog && dialog.hasAttribute("open");
    return matches.call(this, selector);
  });
};

/** A dialog and a region side by side, or the region inside the dialog. */
const mountWithDialog = async (notifier: Notifier, { regionInside = false } = {}) => {
  let setOpenState: (open: boolean) => void = () => {};
  function App() {
    const [open, setOpen] = useState(false);
    setOpenState = setOpen;
    const region = <NotificationRegion notifier={notifier} duration={0} />;
    return (
      <>
        <Dialog title="Upload" trigger="Open" open={open} onOpenChange={setOpen}>
          <p>Body</p>
          {regionInside ? region : null}
        </Dialog>
        {regionInside ? null : region}
      </>
    );
  }
  render(<App />);
  await settle();
  const setOpen = async (next: boolean) => {
    act(() => setOpenState(next));
    await settle();
  };
  return { setOpen };
};

describe("React NotificationRegion while a modal dialog is open", () => {
  it("holds new notifications, then shows them in order after the dialog closes", async () => {
    const notifier = createNotifier();
    const { setOpen } = await mountWithDialog(notifier);
    await setOpen(true);
    act(() => {
      notifier.info("First");
      notifier.info("Second");
    });
    await settle();
    expect(slots()).toHaveLength(0);
    expect(notifier.getSnapshot().map((item) => item.title)).toEqual(["First", "Second"]);

    await setOpen(false);
    expect(titles()).toEqual(["First", "Second"]);
  });

  it("never mounts the region inside the dialog, even when placed in it", async () => {
    const notifier = createNotifier();
    const { setOpen } = await mountWithDialog(notifier, { regionInside: true });
    await setOpen(true);
    act(() => {
      notifier.success("Uploaded");
    });
    await settle();
    const panel = screen.getByRole("dialog");
    const region = screen.getByRole("region", { name: "Notifications", hidden: true });
    expect(region.parentElement).toBe(document.body);
    expect(panel).not.toContainElement(region);
    expect(screen.queryByText("Uploaded")).toBeNull();
  });

  it("announces a held notification only once it is shown", async () => {
    const notifier = createNotifier();
    const { setOpen } = await mountWithDialog(notifier);
    const region = screen.getByRole("region", { name: "Notifications" });
    await setOpen(true);
    act(() => {
      notifier.info("Report ready");
    });
    await settle();
    // Each notification is its own live region: held, there is none to speak.
    expect(within(region).queryByRole("status", { hidden: true })).toBeNull();

    await setOpen(false);
    expect(within(region).getByRole("status", { name: "Report ready" })).toBeInTheDocument();
  });

  it("keeps a shown notification as it was, and shows its change after the dialog closes", async () => {
    const notifier = createNotifier();
    const { setOpen } = await mountWithDialog(notifier);
    let id = "";
    act(() => {
      id = notifier.info("Saving");
    });
    await settle();
    await setOpen(true);
    act(() => notifier.update(id, { title: "Saved" }));
    await settle();
    expect(titles()).toEqual(["Saving"]);

    await setOpen(false);
    expect(titles()).toEqual(["Saved"]);
  });

  it("waits for every stacked modal, and for a modal opened outside the package", async () => {
    const notifier = createNotifier();
    const { setOpen } = await mountWithDialog(notifier);
    const native = document.createElement("dialog");
    document.body.append(native);
    matchModal(native);
    await setOpen(true);
    native.showModal();
    await settle();
    act(() => {
      notifier.info("Later");
    });

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
    const { setOpen } = await mountWithDialog(notifier);
    await setOpen(true);
    act(() => {
      notifier.show({ title: "Held", duration: 1000, onDismiss });
    });
    await settle();
    act(() => vi.advanceTimersByTime(5000));
    expect(onDismiss).not.toHaveBeenCalled();

    await setOpen(false);
    expect(slots()).toHaveLength(1);
    act(() => vi.advanceTimersByTime(999));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledWith("timeout");
  });

  it("holds the countdown of a shown notification while a modal is open", async () => {
    vi.useFakeTimers();
    const notifier = createNotifier();
    const onDismiss = vi.fn();
    const { setOpen } = await mountWithDialog(notifier);
    act(() => {
      notifier.show({ title: "Shown", duration: 1000, onDismiss });
    });
    await settle();
    act(() => vi.advanceTimersByTime(400));
    await setOpen(true);
    // It stays where it was, behind the dialog, and its time stands still.
    expect(slots()).toHaveLength(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(onDismiss).not.toHaveBeenCalled();

    await setOpen(false);
    act(() => vi.advanceTimersByTime(600));
    expect(onDismiss).toHaveBeenCalledWith("timeout");
  });

  it("shows nothing it holds when mounted while a modal is open", async () => {
    const notifier = createNotifier();
    notifier.info("Queued early");
    const native = document.createElement("dialog");
    document.body.append(native);
    matchModal(native);
    native.showModal();
    render(<NotificationRegion notifier={notifier} duration={0} />);
    await settle();
    expect(slots()).toHaveLength(0);

    native.close();
    await settle();
    expect(titles()).toEqual(["Queued early"]);
    native.remove();
  });
});
