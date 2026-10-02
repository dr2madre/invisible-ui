import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { tick } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./dialog-feedback.fixture.svelte";
import StackFixture from "./dialog-stack.fixture.svelte";

// Feedback while a dialog is open (ADR 0016): the status area of every
// dialog in the family, and a dialog opened on top of another.

const openPanel = () => document.querySelector<HTMLElement>("dialog[open]")!;
const statusArea = (panel: HTMLElement) => panel.querySelector<HTMLElement>(".dialog-status")!;
const liveRegion = (panel: HTMLElement) =>
  panel.querySelector<HTMLElement>(".dialog-status__live")!;

const mount = (kind?: "dialog" | "sheet" | "alert" | "confirm" | "prompt" | "search") =>
  render(Fixture, { props: { kind } }).component;

describe("the Svelte dialog status area", () => {
  it("sits between the body and the footer, hidden while empty", async () => {
    const host = mount();
    host.setOpen(true);
    const panel = screen.getByRole("dialog");
    const area = statusArea(panel);
    expect(area.hidden).toBe(true);
    expect(area.previousElementSibling).toHaveClass("dialog__body");
    expect(panel.querySelector(".dialog__footer")!.previousElementSibling).toBe(liveRegion(panel));

    host.notify({ status: "danger", title: "Upload failed", description: "The file is too big." });
    await tick();
    expect(area.hidden).toBe(false);
    const notice = within(area).getByRole("group", { name: "Upload failed" });
    expect(notice).toHaveClass("inline-notification");
    expect(notice).toHaveAttribute("data-status", "danger");
    expect(notice).toHaveTextContent("The file is too big.");
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("announces each notice once through a live region that exists beforehand", async () => {
    const host = mount();
    host.setOpen(true);
    const panel = screen.getByRole("dialog");
    const live = liveRegion(panel);
    expect(live).toHaveAttribute("role", "status");
    expect(live?.textContent?.trim()).toBe("");

    host.notify({ title: "Link copied" });
    await tick();
    // Written after the insertion, never inserted already filled.
    expect(live?.textContent?.trim()).toBe("");
    await waitFor(() => expect(live).toHaveTextContent("Link copied"));
    // The notice itself is not a live region, so it is not read twice.
    const notice = within(statusArea(panel)).getByRole("group");
    expect(notice).not.toHaveAttribute("aria-live");

    host.notify({ title: "Upload failed", description: "Try again." });
    await waitFor(() => expect(live).toHaveTextContent("Upload failed Try again."));
    expect(live).not.toHaveTextContent("Link copied");
  });

  it("keeps focus where it is when a notice appears", async () => {
    const user = userEvent.setup();
    const host = mount();
    await user.click(screen.getByRole("button", { name: "Share" }));
    const input = screen.getByRole("textbox", { name: "Link" });
    input.focus();
    host.notify({ title: "Link copied" });
    await tick();
    expect(input).toHaveFocus();
  });

  it("puts the notice action in the tab order, runs it and closes the notice", async () => {
    const user = userEvent.setup();
    const host = mount();
    const onAction = vi.fn();
    await user.click(screen.getByRole("button", { name: "Share" }));
    host.notify({ status: "danger", title: "Upload failed", action: { label: "Retry", onAction } });
    await tick();
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
    await tick();
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(notice).not.toBeInTheDocument();
    expect(statusArea(panel).hidden).toBe(true);
    // The pressed button left with the notice: the panel holds focus.
    expect(panel).toHaveFocus();
    expect(host.isOpen()).toBe(true);
  });

  it("closes a notice from its own close button without closing the dialog", async () => {
    const user = userEvent.setup();
    const host = mount();
    await user.click(screen.getByRole("button", { name: "Share" }));
    host.notify({ title: "Link copied" });
    await tick();
    const notice = screen.getByRole("group", { name: "Link copied" });
    await user.click(within(notice).getByRole("button", { name: "Close" }));
    await tick();
    expect(notice).not.toBeInTheDocument();
    expect(host.isOpen()).toBe(true);
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("offers no close button when the notice is not dismissible", async () => {
    const host = mount();
    host.setOpen(true);
    host.notify({ title: "Uploading", dismissible: false });
    await tick();
    const notice = screen.getByRole("group", { name: "Uploading" });
    expect(within(notice).queryByRole("button")).toBeNull();
  });

  it("removes notices by id or all at once", async () => {
    const host = mount();
    host.setOpen(true);
    const first = host.notify({ title: "First" });
    host.notify({ title: "Second" });
    host.dismissNotice(first);
    await tick();
    expect(screen.queryByRole("group", { name: "First" })).toBeNull();
    expect(screen.getByRole("group", { name: "Second" })).toBeInTheDocument();
    host.clearNotices();
    await tick();
    expect(screen.queryByRole("group", { name: "Second" })).toBeNull();
    expect(statusArea(screen.getByRole("dialog")).hidden).toBe(true);
  });

  it("shows nothing while closed and clears the notices when the dialog closes", async () => {
    const host = mount();
    expect(host.notify({ title: "Too early" })).toBe("");

    host.setOpen(true);
    host.notify({ title: "Upload failed" });
    await waitFor(() => expect(liveRegion(openPanel())).toHaveTextContent("Upload failed"));

    host.setOpen(false);
    host.setOpen(true);
    expect(screen.queryByRole("group", { name: "Upload failed" })).toBeNull();
    expect(screen.queryByText("Too early")).toBeNull();
    expect(liveRegion(openPanel())?.textContent?.trim()).toBe("");
  });

  it("drops the announcement of a notice removed before its turn", async () => {
    const host = mount();
    host.setOpen(true);
    const live = liveRegion(screen.getByRole("dialog"));
    const id = host.notify({ title: "Gone" });
    host.notify({ title: "Kept" });
    host.dismissNotice(id);
    await waitFor(() => expect(live).toHaveTextContent("Kept"));
    expect(live).not.toHaveTextContent("Gone");
  });

  it.each(["dialog", "sheet"] as const)(
    "ignores a close event from inside the %s panel",
    async (kind) => {
      const host = mount(kind);
      host.setOpen(true);
      // A closable element inside the panel, such as an inline notification
      // from another adapter, can emit a bubbling `close`.
      document
        .querySelector("[data-emitter]")!
        .dispatchEvent(new Event("close", { bubbles: true }));
      await tick();
      expect(host.isOpen()).toBe(true);
      expect(openPanel()).not.toBeNull();
    },
  );
});

describe.each([
  { kind: "sheet", before: ".sheet-dialog__footer" },
  { kind: "alert", before: ".alert-dialog__actions" },
  { kind: "confirm", before: ".confirm-dialog__actions" },
  { kind: "prompt", before: ".prompt-dialog__actions" },
  { kind: "search", before: null },
] as const)("the status area of the Svelte $kind", ({ kind, before }) => {
  it("shows a notice before the actions and clears it on close", async () => {
    const host = mount(kind);
    expect(host.notify({ title: "Too early" })).toBe("");
    host.setOpen(true);
    await tick();
    const panel = openPanel();
    const focused = document.activeElement;
    const id = host.notify({ status: "warning", title: "Connection lost" });
    await tick();
    expect(id).not.toBe("");
    expect(document.activeElement).toBe(focused);
    const notice = within(panel).getByRole("group", { name: "Connection lost" });
    expect(statusArea(panel)).toContainElement(notice);
    if (before) expect(panel.querySelector(before)!.previousElementSibling).toBe(liveRegion(panel));
    else expect(panel.lastElementChild).toBe(liveRegion(panel));
    await waitFor(() => expect(liveRegion(panel)).toHaveTextContent("Connection lost"));

    await userEvent.click(within(notice).getByRole("button", { name: "Close" }));
    await tick();
    expect(host.isOpen()).toBe(true);
    expect(notice).not.toBeInTheDocument();

    host.notify({ title: "Still offline" });
    host.setOpen(false);
    host.setOpen(true);
    const reopened = openPanel();
    expect(within(reopened).queryByRole("group", { name: "Still offline" })).toBeNull();
    expect(liveRegion(reopened)?.textContent?.trim()).toBe("");
  });
});

describe("a Svelte dialog opened on top of another", () => {
  it("takes focus, closes alone on Escape and returns focus inside the dialog below", async () => {
    const user = userEvent.setup();
    const stack = render(StackFixture).component;
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const deleteButton = screen.getByRole("button", { name: "Delete file" });
    await user.click(deleteButton);
    await tick();

    const top = screen.getByRole("dialog", { name: "Delete file?" });
    await waitFor(() => expect(within(top).getByRole("button", { name: "Cancel" })).toHaveFocus());

    await user.keyboard("{Escape}");
    expect(stack.openStates()).toMatchObject({ confirmOpen: false, dialogOpen: true });
    expect(deleteButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(stack.openStates().dialogOpen).toBe(false);
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
  });

  it("closes only the inner preset when it sits inside the dialog's body", async () => {
    const user = userEvent.setup();
    const stack = render(StackFixture).component;
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const deleteButton = screen.getByRole("button", { name: "Delete file" });
    deleteButton.focus();
    stack.setAlertOpen(true);
    const top = screen.getByRole("alertdialog", { name: "Saved" });
    await waitFor(() => expect(within(top).getByRole("button", { name: "OK" })).toHaveFocus());

    await user.keyboard("{Escape}");
    expect(stack.openStates()).toMatchObject({ alertOpen: false, dialogOpen: true });
    expect(deleteButton).toHaveFocus();
  });

  it("counts the scroll lock across the stack", async () => {
    const user = userEvent.setup();
    const stack = render(StackFixture).component;
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    await tick();
    expect(document.body.style.overflow).toBe("hidden");

    stack.setConfirmOpen(false);
    expect(document.body.style.overflow).toBe("hidden");
    stack.setDialogOpen(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("returns focus inside a sheet when a preset opened from it closes", async () => {
    const user = userEvent.setup();
    const stack = render(StackFixture, { props: { below: "sheet" } }).component;
    await user.click(screen.getByRole("button", { name: "Open filters" }));
    const reset = screen.getByRole("button", { name: "Reset filters" });
    await user.click(reset);
    await tick();
    await user.keyboard("{Escape}");
    expect(stack.openStates().dialogOpen).toBe(true);
    expect(reset).toHaveFocus();
  });

  it("falls back to the trigger when the element that had focus is gone", () => {
    const stack = render(StackFixture).component;
    const opener = document.createElement("button");
    opener.textContent = "Open from a menu";
    document.body.append(opener);
    opener.focus();
    stack.setDialogOpen(true);
    opener.remove();
    stack.setDialogOpen(false);
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
  });

  it("returns focus to the element that had it when the dialog opened", () => {
    const stack = render(StackFixture).component;
    const opener = document.createElement("button");
    opener.textContent = "Open from a menu";
    document.body.append(opener);
    opener.focus();
    stack.setDialogOpen(true);
    stack.setDialogOpen(false);
    expect(opener).toHaveFocus();
    opener.remove();
  });
});
