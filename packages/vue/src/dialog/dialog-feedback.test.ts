import { render, screen, waitFor, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, nextTick, ref, type Component, type Slots } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AlertDialog } from "../alert-dialog/AlertDialog";
import { ConfirmDialog } from "../confirm-dialog/ConfirmDialog";
import { LocaleProvider } from "../i18n/i18n";
import { InlineNotification } from "../inline-notification/InlineNotification";
import type { DialogNoticeControls } from "../internal/dialog-status";
import { PromptDialog } from "../prompt-dialog/PromptDialog";
import { SearchDialog } from "../search-dialog/SearchDialog";
import { SheetDialog } from "../sheet-dialog/SheetDialog";
import { Dialog } from "./Dialog";
import { useDialog } from "./use-dialog";

// Feedback while a dialog is open (ADR 0016): the status area of every
// dialog in the family, and a dialog opened on top of another.

type Children = { [name: string]: (() => unknown) | undefined };

/**
 * Render a dialog of the family with a template ref on it and its open state
 * held here, the way an application drives it.
 */
const mount = (component: Component, props: Record<string, unknown>, slots: Children = {}) => {
  const handle = ref<DialogNoticeControls | null>(null);
  const open = ref(false);
  const Harness = defineComponent({
    setup: () => () =>
      h(
        component,
        {
          ...props,
          ref: handle,
          open: open.value,
          "onUpdate:open": (next: boolean) => (open.value = next),
        },
        slots as Slots,
      ),
  });
  render(Harness);
  const setOpen = async (next: boolean) => {
    open.value = next;
    await nextTick();
    await nextTick();
  };
  return { controls: () => handle.value!, open, setOpen };
};

const mountDialog = (slots: Children = {}) =>
  mount(
    Dialog,
    { title: "Share this file", trigger: "Share" },
    {
      default: () =>
        h("label", ["Link ", h("input", { value: "https://example.com/f/1", readonly: true })]),
      footer: () => h("button", { type: "button" }, "Done"),
      ...slots,
    },
  );

const panelOf = () => document.querySelector<HTMLElement>("dialog[open]")!;
const statusArea = (panel: HTMLElement) => panel.querySelector<HTMLElement>(".dialog-status")!;
const liveRegion = (panel: HTMLElement) =>
  panel.querySelector<HTMLElement>(".dialog-status__live")!;

describe("the dialog status area", () => {
  it("sits between the body and the footer, hidden while empty", async () => {
    const { controls, setOpen } = mountDialog();
    await setOpen(true);
    const panel = screen.getByRole("dialog");
    const area = statusArea(panel);
    expect(area.hidden).toBe(true);
    expect(area.previousElementSibling).toHaveClass("dialog__body");
    expect(panel.querySelector(".dialog__footer")!.previousElementSibling).toBe(liveRegion(panel));

    controls().notify({
      status: "danger",
      title: "Upload failed",
      description: "The file is too big.",
    });
    await nextTick();
    expect(area.hidden).toBe(false);
    const notice = within(area).getByRole("group", { name: "Upload failed" });
    expect(notice.querySelector(".inline-notification")).toHaveAttribute("data-status", "danger");
    expect(notice).toHaveTextContent("The file is too big.");
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("announces each notice once through a live region that exists beforehand", async () => {
    const { controls, setOpen } = mountDialog();
    await setOpen(true);
    const live = liveRegion(screen.getByRole("dialog"));
    expect(live).toHaveAttribute("role", "status");
    expect(live).toBeEmptyDOMElement();

    controls().notify({ title: "Link copied" });
    await nextTick();
    // Written after the insertion, never inserted already filled.
    expect(live).toBeEmptyDOMElement();
    await waitFor(() => expect(live).toHaveTextContent("Link copied"));
    // The notice itself is not a live region, so it is not read twice.
    const notice = within(statusArea(screen.getByRole("dialog"))).getByRole("group");
    expect(notice).not.toHaveAttribute("aria-live");
    expect(within(notice).queryByRole("status")).toBeNull();

    controls().notify({ title: "Upload failed", description: "Try again." });
    await waitFor(() => expect(live).toHaveTextContent("Upload failed Try again."));
    expect(live).not.toHaveTextContent("Link copied");
  });

  it("keeps focus where it is when a notice appears", async () => {
    const user = userEvent.setup();
    const { controls } = mountDialog();
    await user.click(screen.getByRole("button", { name: "Share" }));
    const input = screen.getByRole("textbox", { name: "Link" });
    input.focus();
    controls().notify({ title: "Link copied" });
    await nextTick();
    expect(input).toHaveFocus();
  });

  it("puts the notice action in the tab order, runs it and closes the notice", async () => {
    const user = userEvent.setup();
    const { controls, open } = mountDialog();
    const onAction = vi.fn();
    await user.click(screen.getByRole("button", { name: "Share" }));
    controls().notify({
      status: "danger",
      title: "Upload failed",
      action: { label: "Retry", onAction },
    });
    await nextTick();
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
    expect(open.value).toBe(true);
  });

  it("closes a notice from its own close button without closing the dialog", async () => {
    const user = userEvent.setup();
    const { controls, open } = mountDialog();
    await user.click(screen.getByRole("button", { name: "Share" }));
    controls().notify({ title: "Link copied" });
    await nextTick();
    const notice = screen.getByRole("group", { name: "Link copied" });
    await user.click(within(notice).getByRole("button", { name: "Close" }));
    expect(notice).not.toBeInTheDocument();
    expect(open.value).toBe(true);
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("offers no close button when the notice is not dismissible", async () => {
    const { controls, setOpen } = mountDialog();
    await setOpen(true);
    controls().notify({ title: "Uploading", dismissible: false });
    await nextTick();
    const notice = screen.getByRole("group", { name: "Uploading" });
    expect(within(notice).queryByRole("button")).toBeNull();
  });

  it("removes notices by id or all at once", async () => {
    const { controls, setOpen } = mountDialog();
    await setOpen(true);
    const first = controls().notify({ title: "First" });
    controls().notify({ title: "Second" });
    controls().dismissNotice(first);
    await nextTick();
    expect(screen.queryByRole("group", { name: "First" })).toBeNull();
    expect(screen.getByRole("group", { name: "Second" })).toBeInTheDocument();
    controls().clearNotices();
    await nextTick();
    expect(screen.queryByRole("group", { name: "Second" })).toBeNull();
    expect(statusArea(screen.getByRole("dialog")).hidden).toBe(true);
  });

  it("shows nothing while closed and clears the notices when the dialog closes", async () => {
    const { controls, setOpen } = mountDialog();
    expect(controls().notify({ title: "Too early" })).toBe("");

    await setOpen(true);
    controls().notify({ title: "Upload failed" });
    await waitFor(() => expect(liveRegion(panelOf())).toHaveTextContent("Upload failed"));

    await setOpen(false);
    await setOpen(true);
    expect(screen.queryByRole("group", { name: "Upload failed" })).toBeNull();
    expect(screen.queryByText("Too early")).toBeNull();
    expect(liveRegion(panelOf())).toBeEmptyDOMElement();
  });

  it("drops the announcement of a notice removed before its turn", async () => {
    const { controls, setOpen } = mountDialog();
    await setOpen(true);
    const live = liveRegion(screen.getByRole("dialog"));
    const id = controls().notify({ title: "Gone" });
    controls().notify({ title: "Kept" });
    controls().dismissNotice(id);
    await waitFor(() => expect(live).toHaveTextContent("Kept"));
    expect(live).not.toHaveTextContent("Gone");
  });

  it("names the notice close button from the locale provider", async () => {
    const handle = ref<DialogNoticeControls | null>(null);
    const messages = ref({ "inlineNotification.close": "Chiudi avviso" });
    render(
      defineComponent({
        setup: () => () =>
          h(
            LocaleProvider,
            { locale: "it", messages: messages.value },
            {
              default: () =>
                h(
                  Dialog,
                  { ref: handle, title: "Condividi", trigger: "Condividi", open: true },
                  { default: () => h("p", "Corpo") },
                ),
            },
          ),
      }),
    );
    await nextTick();
    handle.value!.notify({ title: "Link copiato" });
    await nextTick();
    const notice = screen.getByRole("group", { name: "Link copiato" });
    expect(within(notice).getByRole("button", { name: "Chiudi avviso" })).toBeInTheDocument();
    messages.value = { "inlineNotification.close": "Chiudi" };
    await nextTick();
    expect(within(notice).getByRole("button", { name: "Chiudi" })).toBeInTheDocument();
  });

  it.each([
    { name: "Dialog", component: Dialog },
    { name: "SheetDialog", component: SheetDialog },
  ])("ignores a close event from inside the panel of $name", async ({ component }) => {
    const user = userEvent.setup();
    const { open, setOpen } = mount(
      component,
      { title: "Share this file" },
      {
        default: () =>
          h(InlineNotification, {
            title: "Link expires in a day",
            description: "Share it soon.",
            closable: true,
          }),
      },
    );
    await setOpen(true);
    const inline = screen.getByRole("status", { name: "Link expires in a day" });
    await user.click(within(inline).getByRole("button", { name: "Close" }));
    expect(open.value).toBe(true);

    // Any element inside the panel may emit a bubbling `close`.
    panelOf()
      .querySelector("p, div")!
      .dispatchEvent(new Event("close", { bubbles: true }));
    await nextTick();
    expect(open.value).toBe(true);
    expect(screen.getByRole("dialog", { name: "Share this file" })).toBeInTheDocument();
  });

  it("is part of useDialog for markup the consumer owns", async () => {
    const exposed = ref<ReturnType<typeof useDialog> | null>(null);
    render(
      defineComponent({
        setup() {
          const dialog = useDialog({ open: true });
          exposed.value = dialog;
          return () =>
            h("dialog", { ...dialog.api.value.contentProps, ref: dialog.panelRef }, [
              h("h2", dialog.api.value.titleProps, "Upload"),
              h(
                "ul",
                dialog.notices.value.map((notice) => h("li", { key: notice.id }, notice.title)),
              ),
            ]);
        },
      }),
    );
    await nextTick();
    const id = exposed.value!.notify({ title: "Upload failed" });
    expect(id).not.toBe("");
    await nextTick();
    expect(screen.getByRole("listitem")).toHaveTextContent("Upload failed");
    exposed.value!.dismissNotice(id);
    await nextTick();
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});

describe.each([
  {
    name: "SheetDialog",
    component: SheetDialog,
    props: { title: "Filters" },
    slots: {
      default: () => h("p", "Body"),
      footer: () => h("button", { type: "button" }, "Apply"),
    },
    before: ".sheet-dialog__footer",
  },
  {
    name: "AlertDialog",
    component: AlertDialog,
    props: { title: "Session expired", description: "Sign in again." },
    slots: {},
    before: ".alert-dialog__actions",
  },
  {
    name: "ConfirmDialog",
    component: ConfirmDialog,
    props: { title: "Delete file?" },
    slots: {},
    before: ".confirm-dialog__actions",
  },
  {
    name: "PromptDialog",
    component: PromptDialog,
    props: { title: "Rename", label: "Name" },
    slots: {},
    before: ".prompt-dialog__actions",
  },
  {
    name: "SearchDialog",
    component: SearchDialog,
    props: { items: [{ value: "settings", label: "Settings" }] },
    slots: {},
    before: null,
  },
])("the status area of $name", ({ component, props, slots, before }) => {
  it("shows a notice before the actions and clears it on close", async () => {
    const { controls, open, setOpen } = mount(component, props, slots);
    expect(controls().notify({ title: "Too early" })).toBe("");
    await setOpen(true);
    const panel = panelOf();
    const focused = document.activeElement;
    const id = controls().notify({ status: "warning", title: "Connection lost" });
    expect(id).not.toBe("");
    await nextTick();
    expect(document.activeElement).toBe(focused);
    const notice = within(panel).getByRole("group", { name: "Connection lost" });
    expect(statusArea(panel)).toContainElement(notice);
    if (before) expect(panel.querySelector(before)!.previousElementSibling).toBe(liveRegion(panel));
    else expect(panel.lastElementChild).toBe(liveRegion(panel));
    await waitFor(() => expect(liveRegion(panel)).toHaveTextContent("Connection lost"));

    await userEvent.click(within(notice).getByRole("button", { name: "Close" }));
    expect(open.value).toBe(true);

    controls().notify({ title: "Still offline" });
    await setOpen(false);
    await setOpen(true);
    const reopened = panelOf();
    expect(within(reopened).queryByRole("group", { name: "Still offline" })).toBeNull();
    expect(liveRegion(reopened)).toBeEmptyDOMElement();
  });
});

describe("a dialog opened on top of another", () => {
  /**
   * An edit dialog with a Delete button that opens a confirm rendered
   * elsewhere in the page, and an alert rendered inside the dialog's body.
   */
  const mountStack = () => {
    const dialogOpen = ref(false);
    const confirmOpen = ref(false);
    const alertOpen = ref(false);
    const sync = (target: typeof dialogOpen) => (next: boolean) => (target.value = next);
    render(
      defineComponent({
        setup: () => () => [
          h(
            Dialog,
            {
              title: "Edit file",
              trigger: "Edit",
              open: dialogOpen.value,
              "onUpdate:open": sync(dialogOpen),
            },
            {
              default: () => [
                h(
                  "button",
                  { type: "button", onClick: () => (confirmOpen.value = true) },
                  "Delete file",
                ),
                h(AlertDialog, {
                  title: "Saved",
                  description: "Your changes are saved.",
                  trigger: "Nested",
                  open: alertOpen.value,
                  "onUpdate:open": sync(alertOpen),
                }),
              ],
            },
          ),
          h(ConfirmDialog, {
            title: "Delete file?",
            trigger: "Delete elsewhere",
            open: confirmOpen.value,
            "onUpdate:open": sync(confirmOpen),
          }),
        ],
      }),
    );
    return { dialogOpen, confirmOpen, alertOpen };
  };

  it("takes focus, closes alone on Escape and returns focus inside the dialog below", async () => {
    const user = userEvent.setup();
    const { dialogOpen, confirmOpen } = mountStack();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const deleteButton = screen.getByRole("button", { name: "Delete file" });
    await user.click(deleteButton);

    const top = screen.getByRole("dialog", { name: "Delete file?" });
    expect(within(top).getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(confirmOpen.value).toBe(false);
    expect(dialogOpen.value).toBe(true);
    expect(deleteButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(dialogOpen.value).toBe(false);
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
  });

  it("closes only the inner preset when it sits inside the dialog's body", async () => {
    const user = userEvent.setup();
    const { dialogOpen, alertOpen } = mountStack();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const deleteButton = screen.getByRole("button", { name: "Delete file" });
    deleteButton.focus();
    alertOpen.value = true;
    await nextTick();
    await nextTick();
    const top = screen.getByRole("alertdialog", { name: "Saved" });
    expect(within(top).getByRole("button", { name: "OK" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(alertOpen.value).toBe(false);
    expect(dialogOpen.value).toBe(true);
    expect(deleteButton).toHaveFocus();
  });

  it("counts the scroll lock across the stack", async () => {
    const user = userEvent.setup();
    const { dialogOpen, confirmOpen } = mountStack();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    expect(document.body.style.overflow).toBe("hidden");

    confirmOpen.value = false;
    await nextTick();
    expect(document.body.style.overflow).toBe("hidden");
    dialogOpen.value = false;
    await nextTick();
    expect(document.body.style.overflow).toBe("");
  });

  it("returns focus inside a sheet when a preset opened from it closes", async () => {
    const user = userEvent.setup();
    const sheetOpen = ref(false);
    const confirmOpen = ref(false);
    render(
      defineComponent({
        setup: () => () => [
          h(
            SheetDialog,
            {
              title: "Filters",
              trigger: "Open filters",
              open: sheetOpen.value,
              "onUpdate:open": (next: boolean) => (sheetOpen.value = next),
            },
            {
              default: () =>
                h(
                  "button",
                  { type: "button", onClick: () => (confirmOpen.value = true) },
                  "Reset filters",
                ),
            },
          ),
          h(ConfirmDialog, {
            title: "Reset every filter?",
            trigger: "Reset elsewhere",
            open: confirmOpen.value,
            "onUpdate:open": (next: boolean) => (confirmOpen.value = next),
          }),
        ],
      }),
    );

    await user.click(screen.getByRole("button", { name: "Open filters" }));
    const reset = screen.getByRole("button", { name: "Reset filters" });
    await user.click(reset);
    await user.keyboard("{Escape}");
    expect(confirmOpen.value).toBe(false);
    expect(sheetOpen.value).toBe(true);
    expect(reset).toHaveFocus();
  });

  it("falls back to the trigger when the element that had focus is gone", async () => {
    const { dialogOpen } = mountStack();
    const opener = document.createElement("button");
    opener.textContent = "Open from a menu";
    document.body.append(opener);
    opener.focus();
    dialogOpen.value = true;
    await nextTick();
    await nextTick();
    opener.remove();
    dialogOpen.value = false;
    await nextTick();
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
  });
});
