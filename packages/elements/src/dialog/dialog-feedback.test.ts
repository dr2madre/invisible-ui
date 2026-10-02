import { screen, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DialogNoticeOptions } from "../internal/dialog-status";
import type { DsLocaleProvider } from "../locale-provider/ds-locale-provider";
import type { DsDialog } from "./ds-dialog";

// Feedback while a dialog is open (ADR 0016): the status area of every
// dialog in the family, and a dialog opened on top of another.

type NoticeHost = HTMLElement & {
  open: boolean;
  notify(options: DialogNoticeOptions): string;
  dismissNotice(id: string): void;
  clearNotices(): void;
};

afterEach(() => {
  document.body.innerHTML = "";
});

const DIALOG = `
  <ds-dialog heading="Share this file" trigger="Share">
    <label>Link <input value="https://example.com/f/1" /></label>
    <button slot="footer">Done</button>
  </ds-dialog>`;

const mountDialog = (html = DIALOG) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-dialog") as DsDialog;
};

const statusArea = (panel: HTMLElement) => panel.querySelector<HTMLElement>(".dialog-status")!;
const liveRegion = (panel: HTMLElement) =>
  panel.querySelector<HTMLElement>(".dialog-status__live")!;

describe("the dialog status area", () => {
  it("sits between the body and the footer, hidden while empty", async () => {
    const host = mountDialog();
    host.open = true;
    const panel = screen.getByRole("dialog");
    const area = statusArea(panel);
    expect(area.hidden).toBe(true);
    expect(area.previousElementSibling).toHaveClass("dialog__body");
    expect(panel.querySelector(".dialog__footer")!.previousElementSibling).toBe(liveRegion(panel));

    host.notify({ status: "danger", title: "Upload failed", description: "The file is too big." });
    expect(area.hidden).toBe(false);
    const notice = within(area).getByRole("group", { name: "Upload failed" });
    expect(notice.querySelector(".inline-notification")).toHaveAttribute("data-status", "danger");
    expect(notice).toHaveTextContent("The file is too big.");
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("announces each notice once through a live region that exists beforehand", async () => {
    const host = mountDialog();
    host.open = true;
    const live = liveRegion(screen.getByRole("dialog"));
    expect(live).toHaveAttribute("role", "status");
    expect(live).toBeEmptyDOMElement();

    host.notify({ title: "Link copied" });
    // Written after the insertion, never inserted already filled.
    expect(live).toBeEmptyDOMElement();
    await waitFor(() => expect(live).toHaveTextContent("Link copied"));
    // The notice itself is not a live region, so it is not read twice.
    expect(within(statusArea(screen.getByRole("dialog"))).getByRole("group")).not.toHaveAttribute(
      "aria-live",
    );

    host.notify({ title: "Upload failed", description: "Try again." });
    await waitFor(() => expect(live).toHaveTextContent("Upload failed Try again."));
    expect(live).not.toHaveTextContent("Link copied");
  });

  it("keeps focus where it is when a notice appears", async () => {
    const user = userEvent.setup();
    const host = mountDialog();
    await user.click(screen.getByRole("button", { name: "Share" }));
    const input = screen.getByRole("textbox", { name: "Link" });
    input.focus();
    host.notify({ title: "Link copied" });
    expect(input).toHaveFocus();
  });

  it("puts the notice action in the tab order, runs it and closes the notice", async () => {
    const user = userEvent.setup();
    const host = mountDialog();
    const onAction = vi.fn();
    await user.click(screen.getByRole("button", { name: "Share" }));
    host.notify({ status: "danger", title: "Upload failed", action: { label: "Retry", onAction } });
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
    expect(statusArea(panel).hidden).toBe(true);
    // The pressed button left with the notice: the panel holds focus.
    expect(panel).toHaveFocus();
    expect(host.open).toBe(true);
  });

  it("closes a notice from its own close button without closing the dialog", async () => {
    const user = userEvent.setup();
    const host = mountDialog();
    await user.click(screen.getByRole("button", { name: "Share" }));
    host.notify({ title: "Link copied" });
    const notice = screen.getByRole("group", { name: "Link copied" });
    await user.click(within(notice).getByRole("button", { name: "Close" }));
    expect(notice).not.toBeInTheDocument();
    expect(host.open).toBe(true);
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("offers no close button when the notice is not dismissible", () => {
    const host = mountDialog();
    host.open = true;
    host.notify({ title: "Uploading", dismissible: false });
    const notice = screen.getByRole("group", { name: "Uploading" });
    expect(within(notice).queryByRole("button")).toBeNull();
  });

  it("removes notices by id or all at once", () => {
    const host = mountDialog();
    host.open = true;
    const first = host.notify({ title: "First" });
    host.notify({ title: "Second" });
    host.dismissNotice(first);
    expect(screen.queryByRole("group", { name: "First" })).toBeNull();
    expect(screen.getByRole("group", { name: "Second" })).toBeInTheDocument();
    host.clearNotices();
    expect(screen.queryByRole("group", { name: "Second" })).toBeNull();
    expect(statusArea(screen.getByRole("dialog")).hidden).toBe(true);
  });

  it("shows nothing while closed and clears the notices when the dialog closes", async () => {
    const host = mountDialog();
    expect(host.notify({ title: "Too early" })).toBe("");

    host.open = true;
    host.notify({ title: "Upload failed" });
    const live = liveRegion(screen.getByRole("dialog"));
    await waitFor(() => expect(live).toHaveTextContent("Upload failed"));

    host.open = false;
    host.open = true;
    expect(screen.queryByRole("group", { name: "Upload failed" })).toBeNull();
    expect(screen.queryByText("Too early")).toBeNull();
    expect(live).toBeEmptyDOMElement();
  });

  it("drops the announcement of a notice removed before its turn", async () => {
    const host = mountDialog();
    host.open = true;
    const live = liveRegion(screen.getByRole("dialog"));
    const id = host.notify({ title: "Gone" });
    host.notify({ title: "Kept" });
    host.dismissNotice(id);
    await waitFor(() => expect(live).toHaveTextContent("Kept"));
    expect(live).not.toHaveTextContent("Gone");
  });

  it("names the notice close button from the locale provider", () => {
    document.body.innerHTML = `<ds-locale-provider locale="it">${DIALOG}</ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as DsLocaleProvider;
    provider.messages = { "inlineNotification.close": "Chiudi avviso" };
    const host = document.querySelector("ds-dialog") as DsDialog;
    host.open = true;
    host.notify({ title: "Link copiato" });
    const notice = screen.getByRole("group", { name: "Link copiato" });
    expect(within(notice).getByRole("button", { name: "Chiudi avviso" })).toBeInTheDocument();
    provider.messages = { "inlineNotification.close": "Chiudi" };
    expect(within(notice).getByRole("button", { name: "Chiudi" })).toBeInTheDocument();
  });

  it("ignores a close event from inside the panel", async () => {
    const user = userEvent.setup();
    mountDialog(`
      <ds-dialog heading="Share this file" trigger="Share">
        <ds-inline-notification title="Link expires in a day" closable></ds-inline-notification>
      </ds-dialog>`);
    await user.click(screen.getByRole("button", { name: "Share" }));
    const inline = screen.getByRole("status", { name: "Link expires in a day" });
    await user.click(within(inline).getByRole("button", { name: "Close" }));
    expect(screen.getByRole("dialog", { name: "Share this file" })).toBeInTheDocument();
  });

  it("ignores a close event from inside a sheet's panel", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `
      <ds-sheet-dialog heading="Filters" trigger="Open filters">
        <ds-inline-notification title="Some filters are hidden" closable></ds-inline-notification>
      </ds-sheet-dialog>`;
    await user.click(screen.getByRole("button", { name: "Open filters" }));
    const inline = screen.getByRole("status", { name: "Some filters are hidden" });
    await user.click(within(inline).getByRole("button", { name: "Close" }));
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });
});

describe.each([
  {
    tag: "ds-sheet-dialog",
    html: `<ds-sheet-dialog heading="Filters" trigger="Open"><p>Body</p><button slot="footer">Apply</button></ds-sheet-dialog>`,
    before: ".sheet-dialog__footer",
  },
  {
    tag: "ds-alert-dialog",
    html: `<ds-alert-dialog heading="Session expired" description="Sign in again." trigger="Open"></ds-alert-dialog>`,
    before: ".alert-dialog__actions",
  },
  {
    tag: "ds-confirm-dialog",
    html: `<ds-confirm-dialog heading="Delete file?" trigger="Open"></ds-confirm-dialog>`,
    before: ".confirm-dialog__actions",
  },
  {
    tag: "ds-prompt-dialog",
    html: `<ds-prompt-dialog heading="Rename" label="Name" trigger="Open"></ds-prompt-dialog>`,
    before: ".prompt-dialog__actions",
  },
  {
    tag: "ds-search-dialog",
    html: `<ds-search-dialog trigger="Open"></ds-search-dialog>`,
    before: null,
  },
])("the status area of <$tag>", ({ tag, html, before }) => {
  it("shows a notice before the actions and clears it on close", async () => {
    document.body.innerHTML = html;
    const host = document.querySelector(tag) as NoticeHost;
    expect(host.notify({ title: "Too early" })).toBe("");
    host.open = true;
    const panel = document.querySelector<HTMLElement>("dialog[open]")!;
    const focused = document.activeElement;
    const id = host.notify({ status: "warning", title: "Connection lost" });
    expect(id).not.toBe("");
    expect(document.activeElement).toBe(focused);
    const notice = within(panel).getByRole("group", { name: "Connection lost" });
    const area = statusArea(panel);
    expect(area).toContainElement(notice);
    if (before) expect(panel.querySelector(before)!.previousElementSibling).toBe(liveRegion(panel));
    else expect(panel.lastElementChild).toBe(liveRegion(panel));
    await waitFor(() => expect(liveRegion(panel)).toHaveTextContent("Connection lost"));

    await userEvent.click(within(notice).getByRole("button", { name: "Close" }));
    expect(host.open).toBe(true);

    host.notify({ title: "Still offline" });
    host.open = false;
    host.open = true;
    const reopened = document.querySelector<HTMLElement>("dialog[open]")!;
    expect(within(reopened).queryByRole("group", { name: "Still offline" })).toBeNull();
    expect(liveRegion(reopened)).toBeEmptyDOMElement();
  });
});

describe("a dialog opened on top of another", () => {
  const STACK = `
    <ds-dialog heading="Edit file" trigger="Edit">
      <button type="button" data-delete>Delete file</button>
      <ds-alert-dialog heading="Saved" description="Your changes are saved." trigger="Nested"></ds-alert-dialog>
    </ds-dialog>
    <ds-confirm-dialog heading="Delete file?" trigger="Delete elsewhere"></ds-confirm-dialog>`;

  const mountStack = () => {
    document.body.innerHTML = STACK;
    const dialog = document.querySelector("ds-dialog") as DsDialog;
    const confirm = document.querySelector("ds-confirm-dialog") as NoticeHost;
    const alert = document.querySelector("ds-alert-dialog") as NoticeHost;
    const deleteButton = document.querySelector<HTMLButtonElement>("[data-delete]")!;
    deleteButton.addEventListener("click", () => (confirm.open = true));
    return { dialog, confirm, alert, deleteButton };
  };

  it("takes focus, closes alone on Escape and returns focus inside the dialog below", async () => {
    const user = userEvent.setup();
    const { dialog, confirm, deleteButton } = mountStack();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(deleteButton);

    const top = screen.getByRole("dialog", { name: "Delete file?" });
    expect(within(top).getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(confirm.open).toBe(false);
    expect(dialog.open).toBe(true);
    expect(deleteButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(dialog.open).toBe(false);
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
  });

  it("closes only the inner preset when it sits inside the dialog's body", async () => {
    const user = userEvent.setup();
    const { dialog, alert, deleteButton } = mountStack();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    deleteButton.focus();
    alert.open = true;
    const top = screen.getByRole("alertdialog", { name: "Saved" });
    expect(within(top).getByRole("button", { name: "OK" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(alert.open).toBe(false);
    expect(dialog.open).toBe(true);
    expect(deleteButton).toHaveFocus();
  });

  it("counts the scroll lock across the stack", async () => {
    const user = userEvent.setup();
    const { dialog, confirm, deleteButton } = mountStack();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(deleteButton);
    expect(document.body.style.overflow).toBe("hidden");

    confirm.open = false;
    expect(document.body.style.overflow).toBe("hidden");
    dialog.open = false;
    expect(document.body.style.overflow).toBe("");
  });

  it("returns focus inside a sheet when a preset opened from it closes", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `
      <ds-sheet-dialog heading="Filters" trigger="Open filters">
        <button type="button" data-reset>Reset filters</button>
      </ds-sheet-dialog>
      <ds-confirm-dialog heading="Reset every filter?" trigger="Reset elsewhere"></ds-confirm-dialog>`;
    const sheet = document.querySelector("ds-sheet-dialog") as NoticeHost;
    const confirm = document.querySelector("ds-confirm-dialog") as NoticeHost;
    const reset = document.querySelector<HTMLButtonElement>("[data-reset]")!;
    reset.addEventListener("click", () => (confirm.open = true));

    await user.click(screen.getByRole("button", { name: "Open filters" }));
    await user.click(reset);
    await user.keyboard("{Escape}");
    expect(sheet.open).toBe(true);
    expect(reset).toHaveFocus();
  });

  it("falls back to the trigger when the element that had focus is gone", () => {
    const { dialog } = mountStack();
    const opener = document.createElement("button");
    opener.textContent = "Open from a menu";
    document.body.append(opener);
    opener.focus();
    dialog.open = true;
    opener.remove();
    dialog.open = false;
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
  });
});
