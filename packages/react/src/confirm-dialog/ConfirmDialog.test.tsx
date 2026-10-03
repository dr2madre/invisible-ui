import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { DialogHandle } from "../dialog/use-dialog-handle";
import { LocaleProvider } from "../i18n/i18n";
import { ConfirmDialog } from "./ConfirmDialog";

const Confirm = (props: Partial<ComponentProps<typeof ConfirmDialog>>) => (
  <ConfirmDialog
    title="Discard changes?"
    description="Your edits will be lost."
    trigger="Discard"
    {...props}
  />
);

describe("React ConfirmDialog", () => {
  it("opens a named dialog from the trigger, focus on Cancel", async () => {
    const user = userEvent.setup();
    render(<Confirm />);
    await user.click(screen.getByRole("button", { name: "Discard" }));
    const dialog = screen.getByRole("dialog", { name: "Discard changes?" });
    expect(dialog).toHaveAccessibleDescription("Your edits will be lost.");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("confirms and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Confirm open onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Confirm open onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Escape cancels and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Confirm onConfirm={onConfirm} />);
    const trigger = screen.getByRole("button", { name: "Discard" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it("urgent switches the role to alertdialog and nothing else", async () => {
    const user = userEvent.setup();
    render(<Confirm open urgent />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const modal = screen.getByRole("alertdialog", { name: "Discard changes?" });
    expect(modal).toHaveAttribute("aria-modal", "true");
    // Same two buttons, same safe-choice focus.
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("omits aria-describedby when there is no description", () => {
    render(<Confirm open description={undefined} />);
    expect(screen.getByRole("dialog", { name: "Discard changes?" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the outcome with custom labels and a danger variant", () => {
    render(
      <Confirm open confirmLabel="Discard" cancelLabel="Keep editing" confirmVariant="danger" />,
    );
    expect(screen.getByRole("button", { name: "Keep editing" })).toBeInTheDocument();
    const confirm = screen.getAllByRole("button", { name: /Discard/ }).at(-1)!;
    expect(confirm).toHaveAttribute("data-variant", "danger");
  });

  it("takes its labels from the catalog", () => {
    render(
      <LocaleProvider
        locale="it"
        messages={{ "dialog.confirm": "Conferma", "dialog.cancel": "Annulla" }}
      >
        <Confirm open />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Conferma" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annulla" })).toBeInTheDocument();
  });

  it("reflects a controlled open prop without reporting it, and reports a user close once", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Confirm onOpenChange={onOpenChange} />);
    rerender(<Confirm open onOpenChange={onOpenChange} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("holds the status area on its ref, cleared on close (ADR 0016)", async () => {
    const user = userEvent.setup();
    const ref = createRef<DialogHandle>();
    render(<Confirm ref={ref} />);
    await user.click(screen.getByRole("button", { name: "Discard" }));

    act(() => {
      ref.current?.notify({ status: "danger", title: "The draft could not be saved" });
    });
    expect(screen.getByRole("group", { name: "The draft could not be saved" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(<Confirm open />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations without a description", async () => {
    const { container } = render(<Confirm open description={undefined} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
