import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsConfirmDialog } from "./ds-confirm-dialog";

const MARKUP = `
  <ds-confirm-dialog
    heading="Discard changes?"
    description="Your edits will be lost."
    trigger="Discard"
  ></ds-confirm-dialog>`;

const mount = (html: string = MARKUP) => {
  document.body.innerHTML = html;
  const host = document.querySelector("ds-confirm-dialog") as DsConfirmDialog;
  const onConfirm = vi.fn();
  host.addEventListener("confirm", onConfirm);
  return { host, onConfirm };
};

const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });

describe("<ds-confirm-dialog>", () => {
  it("opens a named, described dialog from the trigger, focus on the safe choice", async () => {
    const user = userEvent.setup();
    mount();
    const trigger = screen.getByRole("button", { name: "Discard" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Discard changes?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Your edits will be lost.");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("confirms and closes", async () => {
    const user = userEvent.setup();
    const { host, onConfirm } = mount();
    host.open = true;
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels without confirming and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const { onConfirm } = mount();
    const trigger = screen.getByRole("button", { name: "Discard" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("Escape and a backdrop press cancel", async () => {
    const user = userEvent.setup();
    const { host, onConfirm } = mount();
    host.open = true;
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    host.open = true;
    pressBackdrop(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("names outcomes through the label attributes", async () => {
    const user = userEvent.setup();
    const { onConfirm } = mount(`<ds-confirm-dialog heading="Delete file?" trigger="Delete"
      confirm-label="Delete file" cancel-label="Keep file" confirm-variant="danger">
    </ds-confirm-dialog>`);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const confirm = screen.getByRole("button", { name: "Delete file" });
    expect(confirm.dataset.variant).toBe("danger");
    expect(screen.getByRole("button", { name: "Keep file" })).toHaveFocus();
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("urgent switches the role to alertdialog and nothing else", async () => {
    const user = userEvent.setup();
    const { host } = mount();
    host.setAttribute("urgent", "");
    host.open = true;
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const modal = screen.getByRole("alertdialog", { name: "Discard changes?" });
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("omits aria-describedby when there is no description", () => {
    const { host } = mount(`<ds-confirm-dialog heading="Discard changes?"></ds-confirm-dialog>`);
    host.open = true;
    expect(screen.getByRole("dialog", { name: "Discard changes?" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("has no close button by default and shows one on request", async () => {
    const user = userEvent.setup();
    const { host } = mount();
    host.open = true;
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    host.setAttribute("close-button", "");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports user-driven open changes", async () => {
    const user = userEvent.setup();
    const { host } = mount();
    const onOpenChange = vi.fn();
    host.addEventListener("open-change", (e) => onOpenChange((e as CustomEvent).detail));
    await user.click(screen.getByRole("button", { name: "Discard" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange.mock.calls).toEqual([[{ open: true }], [{ open: false }]]);
  });

  it("has no accessibility violations when open", async () => {
    const { host } = mount();
    host.open = true;
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("has no accessibility violations without a description", async () => {
    const { host } = mount(`<ds-confirm-dialog heading="Discard changes?"></ds-confirm-dialog>`);
    host.open = true;
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
