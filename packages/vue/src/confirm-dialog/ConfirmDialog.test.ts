import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { ConfirmDialog } from "./ConfirmDialog";

const renderConfirm = (props: Record<string, unknown> = {}) =>
  render(ConfirmDialog, {
    props: {
      title: "Discard changes?",
      description: "Your edits will be lost.",
      trigger: "Discard",
      ...props,
    },
  });

const openIt = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Discard" }));

describe("Vue ConfirmDialog (styled)", () => {
  it("opens a named dialog from the trigger, with the safe choice focused", async () => {
    const user = userEvent.setup();
    renderConfirm();

    await openIt(user);
    const dialog = screen.getByRole("dialog", { name: "Discard changes?" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription("Your edits will be lost.");
    expect(screen.getByText("Your edits will be lost.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("confirms and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderConfirm({ onConfirm });

    await openIt(user);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderConfirm({ onConfirm });

    await openIt(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("urgent switches the role to alertdialog and nothing else", async () => {
    const user = userEvent.setup();
    renderConfirm({ urgent: true });

    await openIt(user);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const modal = screen.getByRole("alertdialog", { name: "Discard changes?" });
    expect(modal).toHaveAttribute("aria-modal", "true");
    // Same two buttons, same safe-choice focus.
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("omits aria-describedby when there is no description", async () => {
    const user = userEvent.setup();
    renderConfirm({ description: undefined });

    await openIt(user);
    const dialog = screen.getByRole("dialog", { name: "Discard changes?" });
    expect(dialog).not.toHaveAttribute("aria-describedby");
  });

  it("labels the buttons with the given outcomes", async () => {
    const user = userEvent.setup();
    renderConfirm({
      title: "Delete this file?",
      description: "“report-q3.pdf” will be permanently deleted.",
      confirmLabel: "Delete file",
      cancelLabel: "Keep file",
      confirmVariant: "danger",
    });

    await openIt(user);
    expect(screen.getByRole("button", { name: "Keep file" })).toBeInTheDocument();
    // The danger variant carries the hazard icon next to the label.
    expect(screen.getByRole("button", { name: /Delete file/ })).toBeInTheDocument();
  });

  it("takes the default labels from the locale catalog", async () => {
    const user = userEvent.setup();
    render(LocaleProvider, {
      props: { messages: { "dialog.confirm": "Conferma", "dialog.cancel": "Annulla" } },
      slots: {
        default: () =>
          h(ConfirmDialog, {
            title: "Discard changes?",
            description: "Your edits will be lost.",
            trigger: "Discard",
          }),
      },
    });

    await openIt(user);
    expect(screen.getByRole("button", { name: "Annulla" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conferma" })).toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    renderConfirm();
    await openIt(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("has no accessibility violations without a description", async () => {
    const user = userEvent.setup();
    renderConfirm({ description: undefined });
    await openIt(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
