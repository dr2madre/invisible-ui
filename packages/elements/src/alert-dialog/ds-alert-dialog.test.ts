import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsAlertDialog } from "./ds-alert-dialog";

const MARKUP = `
  <ds-alert-dialog
    heading="File deleted"
    description="“report-q3.pdf” was permanently deleted."
    trigger="Show alert"
  ></ds-alert-dialog>`;

const mount = (html: string = MARKUP) => {
  document.body.innerHTML = html;
  const host = document.querySelector("ds-alert-dialog") as DsAlertDialog;
  const onDismiss = vi.fn();
  host.addEventListener("dismiss", onDismiss);
  return { host, onDismiss };
};

// Native <dialog>: backdrop presses target the element itself, with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });
const openIt = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Show alert" }));

describe("<ds-alert-dialog>", () => {
  it("is closed by default, with no dialog in the page", () => {
    mount();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("opens as a native alertdialog, named and described, focus on the only button", async () => {
    const user = userEvent.setup();
    mount();
    await openIt(user);

    const modal = screen.getByRole("alertdialog");
    expect(modal.tagName).toBe("DIALOG");
    expect((modal as HTMLDialogElement).open).toBe(true);
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAccessibleName("File deleted");
    expect(modal).toHaveAccessibleDescription("“report-q3.pdf” was permanently deleted.");
    expect(screen.getByRole("button", { name: "OK" })).toHaveFocus();
  });

  it("renders exactly one action button and no close button by default", async () => {
    const user = userEvent.setup();
    mount();
    await openIt(user);
    const buttons = Array.from(screen.getByRole("alertdialog").querySelectorAll("button"));
    expect(buttons.filter((button) => !button.hidden)).toHaveLength(1);
  });

  it("the button acknowledges: dismiss is emitted and it closes", async () => {
    const user = userEvent.setup();
    const { onDismiss } = mount();
    await openIt(user);
    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Escape is equivalent to the button and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const { onDismiss } = mount();
    const trigger = screen.getByRole("button", { name: "Show alert" });
    await openIt(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it("a backdrop press is equivalent to the button, unless opted out", async () => {
    const user = userEvent.setup();
    const { host, onDismiss } = mount();
    await openIt(user);
    pressBackdrop(screen.getByRole("alertdialog"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);

    host.setAttribute("no-outside-close", "");
    await openIt(user);
    pressBackdrop(screen.getByRole("alertdialog"));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("accepts a contextual dismiss label", async () => {
    const user = userEvent.setup();
    mount(`<ds-alert-dialog heading="Terms" description="Read them." trigger="Show alert"
      dismiss-label="I understood"></ds-alert-dialog>`);
    await openIt(user);
    expect(screen.getByRole("button", { name: "I understood" })).toBeInTheDocument();
  });

  it("shows a close button on request, which acknowledges like Escape", async () => {
    const user = userEvent.setup();
    const { host, onDismiss } = mount();
    host.setAttribute("close-button", "");
    host.setAttribute("close-label", "Dismiss");
    await openIt(user);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("opens from the open attribute without reporting it", () => {
    const { host } = mount();
    const onOpenChange = vi.fn();
    host.addEventListener("open-change", onOpenChange);
    host.open = true;
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("puts a slotted icon in the header", async () => {
    const user = userEvent.setup();
    mount(`<ds-alert-dialog heading="File deleted" description="Gone." trigger="Show alert">
      <span slot="icon" class="glyph" aria-hidden="true">!</span>
    </ds-alert-dialog>`);
    await openIt(user);
    expect(document.querySelector(".dialog-header__icon .glyph")).not.toBeNull();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    mount();
    await openIt(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
