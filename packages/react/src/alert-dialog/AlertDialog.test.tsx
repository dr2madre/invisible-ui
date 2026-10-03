import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { DialogHandle } from "../dialog/use-dialog-handle";
import { LocaleProvider } from "../i18n/i18n";
import { AlertDialog } from "./AlertDialog";

// Native <dialog>: backdrop presses target the element itself with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });

const Alert = (props: Partial<ComponentProps<typeof AlertDialog>>) => (
  <>
    <button type="button">before</button>
    <AlertDialog
      title="File deleted"
      description="“report-q3.pdf” was permanently deleted."
      trigger="Show alert"
      {...props}
    />
    <button type="button">after</button>
  </>
);

const openIt = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Show alert" }));

describe("React AlertDialog (styled)", () => {
  it("is closed by default", () => {
    render(<Alert />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens as an alertdialog, named and described, focus on the only button", async () => {
    const user = userEvent.setup();
    render(<Alert />);

    await openIt(user);
    const modal = screen.getByRole("alertdialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAccessibleName("File deleted");
    expect(modal).toHaveAccessibleDescription("“report-q3.pdf” was permanently deleted.");
    expect(screen.getByRole("button", { name: "OK" })).toHaveFocus();
  });

  it("renders exactly one action button", async () => {
    const user = userEvent.setup();
    render(<Alert />);
    await openIt(user);
    expect(screen.getByRole("alertdialog").querySelectorAll("button")).toHaveLength(1);
  });

  it("the button acknowledges: onDismiss runs and it closes", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss} />);

    await openIt(user);
    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Escape is equivalent to the button and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss} />);
    const trigger = screen.getByRole("button", { name: "Show alert" });

    await openIt(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it("a backdrop press is equivalent to the button by default", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss} />);
    await openIt(user);

    pressBackdrop(screen.getByRole("alertdialog"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("keeps open on a backdrop press when closeOnOutsideClick is false", async () => {
    const user = userEvent.setup();
    render(<Alert closeOnOutsideClick={false} />);
    await openIt(user);

    pressBackdrop(screen.getByRole("alertdialog"));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("accepts a contextual dismiss label", async () => {
    const user = userEvent.setup();
    render(<Alert dismissLabel="I understood" />);
    await openIt(user);
    expect(screen.getByRole("button", { name: "I understood" })).toBeInTheDocument();
  });

  it("reflects a controlled open prop without reporting it (ADR 0011)", () => {
    const onOpenChange = vi.fn();
    const onDismiss = vi.fn();
    const { rerender } = render(<Alert onOpenChange={onOpenChange} onDismiss={onDismiss} />);

    rerender(<Alert open onOpenChange={onOpenChange} onDismiss={onDismiss} />);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    rerender(<Alert open={false} onOpenChange={onOpenChange} onDismiss={onDismiss} />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("reports one change per action", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onDismiss = vi.fn();
    render(<Alert open onOpenChange={onOpenChange} onDismiss={onDismiss} />);

    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("takes its labels from the catalog", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="it" messages={{ "dialog.dismiss": "Ho capito" }}>
        <Alert />
      </LocaleProvider>,
    );
    await openIt(user);
    expect(screen.getByRole("button", { name: "Ho capito" })).toBeInTheDocument();
  });

  it("holds the status area on its ref (ADR 0016)", async () => {
    const user = userEvent.setup();
    const ref = createRef<DialogHandle>();
    render(<Alert ref={ref} />);
    expect(ref.current?.notify({ title: "Not yet" })).toBe("");

    await openIt(user);
    act(() => {
      ref.current?.notify({ status: "warning", title: "Undo is no longer available" });
    });
    expect(screen.getByRole("group", { name: "Undo is no longer available" })).toBeInTheDocument();
    // The notice comes before the action, so the button stays last in tab order.
    const panel = screen.getByRole("alertdialog");
    expect(panel.querySelector(".dialog-status + .dialog-status__live + footer")).not.toBeNull();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(<Alert />);
    await openIt(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
