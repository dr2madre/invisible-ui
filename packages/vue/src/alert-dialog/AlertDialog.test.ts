import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AlertDialog } from "./AlertDialog";

// Native <dialog>: backdrop presses target the element itself, with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });

const renderAlert = (props: Record<string, unknown> = {}) =>
  render(AlertDialog, {
    props: {
      title: "File deleted",
      description: "“report-q3.pdf” was permanently deleted.",
      trigger: "Show alert",
      ...props,
    },
  });

const openIt = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Show alert" }));

describe("Vue AlertDialog (styled)", () => {
  it("is closed by default", () => {
    renderAlert();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens as an alertdialog, named + described, focus on the only button", async () => {
    const user = userEvent.setup();
    renderAlert();

    await openIt(user);
    const modal = screen.getByRole("alertdialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAccessibleName("File deleted");
    expect(modal).toHaveAccessibleDescription("“report-q3.pdf” was permanently deleted.");
    expect(screen.getByRole("button", { name: "OK" })).toHaveFocus();
  });

  it("renders exactly one action button", async () => {
    const user = userEvent.setup();
    renderAlert();
    await openIt(user);
    const modal = screen.getByRole("alertdialog");
    expect(modal.querySelectorAll("button")).toHaveLength(1);
  });

  it("the button acknowledges: onDismiss runs and it closes", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    renderAlert({ onDismiss });

    await openIt(user);
    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Escape is equivalent to the button and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    renderAlert({ onDismiss });
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
    renderAlert({ onDismiss });
    await openIt(user);

    await pressBackdrop(screen.getByRole("alertdialog"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("keeps open on a backdrop press when closeOnOutsideClick is false", async () => {
    const user = userEvent.setup();
    renderAlert({ closeOnOutsideClick: false });
    await openIt(user);

    await pressBackdrop(screen.getByRole("alertdialog"));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("accepts a contextual dismiss label", async () => {
    const user = userEvent.setup();
    renderAlert({ dismissLabel: "I understood" });
    await openIt(user);
    expect(screen.getByRole("button", { name: "I understood" })).toBeInTheDocument();
  });

  it("supports v-model:open: emits update:open on both edges", async () => {
    const user = userEvent.setup();
    const { emitted } = renderAlert();

    await openIt(user);
    await user.keyboard("{Escape}");
    expect(emitted("update:open")).toEqual([[true], [false]]);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    renderAlert();
    await openIt(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
