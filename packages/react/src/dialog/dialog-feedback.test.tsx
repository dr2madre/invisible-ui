import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState, type RefObject } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import { LocaleProvider } from "../i18n/i18n";
import { Dialog, type DialogHandle } from "./Dialog";
import { useDialog } from "./use-dialog";

// Feedback while a dialog is open (ADR 0016): the status area of the dialog,
// and a dialog opened on top of another.

afterEach(() => {
  document.body.style.overflow = "";
});

const statusArea = (panel: HTMLElement) => panel.querySelector<HTMLElement>(".dialog-status")!;
const liveRegion = (panel: HTMLElement) =>
  panel.querySelector<HTMLElement>(".dialog-status__live")!;

function Share({
  handle,
  open,
  messages,
}: {
  handle: RefObject<DialogHandle | null>;
  open?: boolean;
  messages?: Record<string, string>;
}) {
  const dialog = (
    <Dialog
      ref={handle}
      title="Share this file"
      trigger="Share"
      open={open}
      footer={<Button>Done</Button>}
    >
      <label>
        Link <input defaultValue="https://example.com/f/1" />
      </label>
    </Dialog>
  );
  return messages ? (
    <LocaleProvider locale="it" messages={messages}>
      {dialog}
    </LocaleProvider>
  ) : (
    dialog
  );
}

const mount = (props: { open?: boolean; messages?: Record<string, string> } = {}) => {
  const handle = createRef<DialogHandle>();
  const view = render(<Share handle={handle} {...props} />);
  const notify = (options: Parameters<DialogHandle["notify"]>[0]) => {
    let id = "";
    act(() => {
      id = handle.current!.notify(options);
    });
    return id;
  };
  return { handle, notify, ...view };
};

describe("the dialog status area", () => {
  it("sits between the body and the footer, hidden while empty", async () => {
    const { notify } = mount({ open: true });
    const panel = screen.getByRole("dialog");
    const area = statusArea(panel);
    expect(area).not.toBeVisible();
    expect(area.previousElementSibling).toHaveClass("dialog__body");
    expect(panel.querySelector(".dialog__footer")!.previousElementSibling).toBe(liveRegion(panel));

    notify({ status: "danger", title: "Upload failed", description: "The file is too big." });
    expect(area).toBeVisible();
    const notice = within(area).getByRole("group", { name: "Upload failed" });
    expect(notice.querySelector(".inline-notification")).toHaveAttribute("data-status", "danger");
    expect(notice).toHaveTextContent("The file is too big.");
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("renders the Inline Notification markup with the status icon", () => {
    const { notify } = mount({ open: true });
    notify({
      status: "danger",
      title: "Upload failed",
      description: "The file is too big.",
      action: { label: "Retry", onAction: () => {} },
    });
    const notice = screen.getByRole("group", { name: "Upload failed" });
    const root = notice.querySelector(".inline-notification")!;
    expect(root.querySelector(".inline-notification__content")).toContainElement(
      root.querySelector(".inline-notification__title"),
    );
    expect(root.querySelector(".inline-notification__title")).toHaveTextContent("Upload failed");
    expect(root.querySelector(".inline-notification__body")).toHaveTextContent(
      "The file is too big.",
    );
    expect(root.querySelector(".inline-notification__actions")).toContainElement(
      within(notice).getByRole("button", { name: "Retry" }),
    );
    expect(root.querySelector(".inline-notification__close")).toContainElement(
      within(notice).getByRole("button", { name: "Close" }),
    );
    // The icon is the first part, decorative, drawn like the elements adapter's.
    const icon = root.firstElementChild!;
    expect(icon).toHaveClass("feedback-icon");
    expect(icon).toHaveAttribute("data-status", "danger");
    expect(icon).toHaveAttribute("data-shape", "rounded");
    expect(icon).toHaveAttribute("data-box", "transparent");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon.querySelector("svg.icon polygon")).toBeInTheDocument();
  });

  it("draws a different glyph for each status", () => {
    const { notify } = mount({ open: true });
    const statuses = ["info", "success", "warning", "danger", "neutral"] as const;
    for (const status of statuses) notify({ status, title: status });
    const glyphs = statuses.map((status) => {
      const notice = screen.getByRole("group", { name: status });
      return notice.querySelector(".feedback-icon svg")!.innerHTML;
    });
    expect(new Set(glyphs).size).toBe(statuses.length);
  });

  it("falls back to the info status for an unknown one", () => {
    const { notify } = mount({ open: true });
    notify({ status: "loud" as never, title: "Heads up" });
    const notice = screen.getByRole("group", { name: "Heads up" });
    expect(notice.querySelector(".inline-notification")).toHaveAttribute("data-status", "info");
  });

  it("announces each notice once through a live region that exists beforehand", async () => {
    const { notify } = mount({ open: true });
    const live = liveRegion(screen.getByRole("dialog"));
    expect(live).toHaveAttribute("role", "status");
    expect(live).toBeEmptyDOMElement();

    notify({ title: "Link copied" });
    // Written after the insertion, never inserted already filled.
    expect(live).toBeEmptyDOMElement();
    await waitFor(() => expect(live).toHaveTextContent("Link copied"));
    // The notice itself is not a live region, so it is not read twice.
    expect(screen.getByRole("group", { name: "Link copied" })).not.toHaveAttribute("aria-live");

    notify({ title: "Upload failed", description: "Try again." });
    expect(live).toBeEmptyDOMElement();
    await waitFor(() => expect(live).toHaveTextContent("Upload failed Try again."));
    expect(live).not.toHaveTextContent("Link copied");
  });

  it("keeps focus where it is when a notice appears", async () => {
    const user = userEvent.setup();
    const { notify } = mount();
    await user.click(screen.getByRole("button", { name: "Share" }));
    const input = screen.getByRole("textbox", { name: "Link" });
    input.focus();
    notify({ title: "Link copied" });
    expect(input).toHaveFocus();
  });

  it("puts the notice action in the tab order, runs it and closes the notice", async () => {
    const user = userEvent.setup();
    const { notify } = mount();
    const onAction = vi.fn();
    await user.click(screen.getByRole("button", { name: "Share" }));
    notify({ status: "danger", title: "Upload failed", action: { label: "Retry", onAction } });
    const panel = screen.getByRole("dialog");
    const notice = within(panel).getByRole("group", { name: "Upload failed" });

    screen.getByRole("textbox", { name: "Link" }).focus();
    await user.tab();
    expect(within(notice).getByRole("button", { name: "Retry" })).toHaveFocus();
    await user.tab();
    expect(within(notice).getByRole("button", { name: "Close" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Done" })).toHaveFocus();

    await user.click(within(notice).getByRole("button", { name: "Retry" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(notice).not.toBeInTheDocument();
    expect(statusArea(panel)).not.toBeVisible();
    // The pressed button left with the notice: the panel holds focus.
    expect(panel).toHaveFocus();
    expect(screen.getByRole("dialog")).toBe(panel);
  });

  it("closes a notice from its own close button without closing the dialog", async () => {
    const user = userEvent.setup();
    const { notify } = mount();
    await user.click(screen.getByRole("button", { name: "Share" }));
    notify({ title: "Link copied" });
    const notice = screen.getByRole("group", { name: "Link copied" });
    await user.click(within(notice).getByRole("button", { name: "Close" }));
    expect(notice).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("gives focus to the panel when clearing removes the focused notice", async () => {
    const user = userEvent.setup();
    const { handle, notify } = mount();
    await user.click(screen.getByRole("button", { name: "Share" }));
    notify({ title: "Upload failed", action: { label: "Retry", onAction: () => {} } });
    screen.getByRole("button", { name: "Retry" }).focus();
    act(() => handle.current!.clearNotices());
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("offers no close button when the notice is not dismissible", () => {
    const { notify } = mount({ open: true });
    notify({ title: "Uploading", dismissible: false });
    const notice = screen.getByRole("group", { name: "Uploading" });
    expect(within(notice).queryByRole("button")).toBeNull();
  });

  it("removes notices by id or all at once", () => {
    const { handle, notify } = mount({ open: true });
    const first = notify({ title: "First" });
    notify({ title: "Second" });
    act(() => handle.current!.dismissNotice(first));
    expect(screen.queryByRole("group", { name: "First" })).toBeNull();
    expect(screen.getByRole("group", { name: "Second" })).toBeInTheDocument();
    act(() => handle.current!.clearNotices());
    expect(screen.queryByRole("group", { name: "Second" })).toBeNull();
    expect(statusArea(screen.getByRole("dialog"))).not.toBeVisible();
  });

  it("shows nothing while closed and clears the notices when the dialog closes", async () => {
    const handle = createRef<DialogHandle>();
    const { rerender } = render(<Share handle={handle} open={false} />);
    expect(handle.current!.notify({ title: "Too early" })).toBe("");

    rerender(<Share handle={handle} open />);
    act(() => void handle.current!.notify({ title: "Upload failed" }));
    await waitFor(() =>
      expect(liveRegion(screen.getByRole("dialog"))).toHaveTextContent("Upload failed"),
    );

    rerender(<Share handle={handle} open={false} />);
    rerender(<Share handle={handle} open />);
    expect(screen.queryByRole("group", { name: "Upload failed" })).toBeNull();
    expect(screen.queryByText("Too early")).toBeNull();
    expect(liveRegion(screen.getByRole("dialog"))).toBeEmptyDOMElement();
  });

  it("drops the announcement of a notice removed before its turn", async () => {
    const { handle, notify } = mount({ open: true });
    const live = liveRegion(screen.getByRole("dialog"));
    const id = notify({ title: "Gone" });
    notify({ title: "Kept" });
    act(() => handle.current!.dismissNotice(id));
    await waitFor(() => expect(live).toHaveTextContent("Kept"));
    expect(live).not.toHaveTextContent("Gone");
  });

  it("names the notice close button from the locale provider", () => {
    const { notify } = mount({
      open: true,
      messages: { "inlineNotification.close": "Chiudi avviso" },
    });
    notify({ title: "Link copiato" });
    const notice = screen.getByRole("group", { name: "Link copiato" });
    expect(within(notice).getByRole("button", { name: "Chiudi avviso" })).toBeInTheDocument();
  });

  it("ignores a close event from inside the panel", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Share" }));
    const input = screen.getByRole("textbox", { name: "Link" });
    act(() => void input.dispatchEvent(new Event("close", { bubbles: true })));
    expect(screen.getByRole("dialog", { name: "Share this file" })).toBeInTheDocument();
  });
});

describe("the useDialog status area", () => {
  function Bare() {
    const { api, open, panelRef, notices, announcement, notify } = useDialog({ open: true });
    const [id, setId] = useState("");
    const report = () =>
      setId(notify({ status: "success", title: "Uploaded", description: "3 files." }));
    return open ? (
      <dialog {...api.contentProps} ref={panelRef}>
        <h2 {...api.titleProps}>Upload</h2>
        <button type="button" onClick={report}>
          Report
        </button>
        <span data-id>{id}</span>
        <ul>
          {notices.map((notice) => (
            <li key={notice.id} id={notice.id} data-status={notice.status}>
              {notice.title}
            </li>
          ))}
        </ul>
        <p role="status">{announcement.join(" ")}</p>
      </dialog>
    ) : null;
  }

  it("gives headless markup the notices and their announcement", async () => {
    const user = userEvent.setup();
    render(<Bare />);
    await user.click(screen.getByRole("button", { name: "Report" }));
    const id = document.querySelector("[data-id]")!.textContent!;
    expect(id).not.toBe("");
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Uploaded");
    expect(item).toHaveAttribute("id", id);
    expect(item).toHaveAttribute("data-status", "success");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Uploaded 3 files."));
  });
});

describe("a dialog opened on top of another", () => {
  // The confirm dialog sits outside the edit dialog and opens from a button
  // inside it, so focus has to come back into the dialog below.
  function Stack() {
    const [confirmOpen, setConfirmOpen] = useState(false);
    return (
      <>
        <Dialog title="Edit file" trigger="Edit">
          <Button onPress={() => setConfirmOpen(true)}>Delete file</Button>
        </Dialog>
        <Dialog
          title="Delete file?"
          trigger="Delete elsewhere"
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
        >
          <p>This cannot be undone.</p>
        </Dialog>
      </>
    );
  }

  it("takes focus, closes alone on Escape and returns focus inside the dialog below", async () => {
    const user = userEvent.setup();
    render(<Stack />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const deleteButton = screen.getByRole("button", { name: "Delete file" });
    await user.click(deleteButton);

    const top = screen.getByRole("dialog", { name: "Delete file?" });
    expect(top).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Delete file?" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "Edit file" })).toBeInTheDocument();
    expect(deleteButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
  });

  it("returns focus to the opener inside the dialog below when nested in it", async () => {
    const user = userEvent.setup();
    function Nested() {
      const [confirmOpen, setConfirmOpen] = useState(false);
      return (
        <Dialog
          title="Edit profile"
          trigger="Edit profile"
          footer={
            <>
              <Button onPress={() => setConfirmOpen(true)}>Discard</Button>
              <Dialog
                title="Discard changes?"
                trigger="Ask"
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
              >
                <p>Your edits will be lost.</p>
              </Dialog>
            </>
          }
        >
          <p>Body</p>
        </Dialog>
      );
    }
    render(<Nested />);
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    const discard = screen.getByRole("button", { name: "Discard" });
    await user.click(discard);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Edit profile" })).toBeInTheDocument();
    expect(discard).toHaveFocus();
  });

  it("counts the scroll lock across the stack", async () => {
    const user = userEvent.setup();
    render(<Stack />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("falls back to the trigger when the element that had focus is gone", () => {
    function Opener({ open, withOpener }: { open: boolean; withOpener: boolean }) {
      return (
        <>
          {withOpener ? <button type="button">Open from a menu</button> : null}
          <Dialog title="Edit file" trigger="Edit" open={open}>
            <p>Body</p>
          </Dialog>
        </>
      );
    }
    const { rerender } = render(<Opener open={false} withOpener />);
    screen.getByRole("button", { name: "Open from a menu" }).focus();
    rerender(<Opener open withOpener />);
    rerender(<Opener open withOpener={false} />);
    rerender(<Opener open={false} withOpener={false} />);
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
  });

  it("closes on the panel's own close event", async () => {
    const user = userEvent.setup();
    render(<Stack />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const panel = screen.getByRole("dialog", { name: "Edit file" }) as HTMLDialogElement;
    act(() => panel.close());
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
