import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsDialog } from "./ds-dialog";

const MARKUP = `
  <ds-dialog heading="Share this file" description="Anyone with the link can view it." trigger="Open dialog">
    <p>Body content</p>
  </ds-dialog>`;

const mount = (html: string = MARKUP) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-dialog") as DsDialog;
};

// Native <dialog>: backdrop presses target the element itself, with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });

describe("<ds-dialog>", () => {
  it("is closed by default with the trigger advertising the dialog", () => {
    mount();
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a native modal, named and described, focus inside", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog", { name: "Share this file" });
    expect(panel.tagName).toBe("DIALOG");
    expect((panel as HTMLDialogElement).open).toBe(true);
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAccessibleDescription("Anyone with the link can view it.");
    expect(panel).toHaveFocus();
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    mount();
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on a backdrop press, unless opted out", async () => {
    const user = userEvent.setup();
    const host = mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    pressBackdrop(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    host.setAttribute("no-outside-close", "");
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    pressBackdrop(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("is controllable through the open attribute and emits open-change", async () => {
    const user = userEvent.setup();
    const host = mount();
    const onOpenChange = vi.fn();
    host.addEventListener("open-change", (e) => onOpenChange((e as CustomEvent).detail));

    host.open = true;
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith({ open: false });
    expect(host.open).toBe(false);
  });

  it("honours initial-focus", async () => {
    const user = userEvent.setup();
    mount(`<ds-dialog heading="Rename" trigger="Open dialog" initial-focus=".target">
      <input class="target" aria-label="New name" />
    </ds-dialog>`);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("textbox", { name: "New name" })).toHaveFocus();
  });

  it("the trigger attributes drive the button after the first render", () => {
    const host = mount();
    const trigger = screen.getByRole("button", { name: "Open dialog" });

    host.setAttribute("trigger", "Share");
    host.setAttribute("trigger-variant", "primary");

    expect(trigger).toHaveTextContent("Share");
    expect(trigger.dataset.variant).toBe("primary");
  });

  it("the close-label attribute drives the close button after the first render", async () => {
    const user = userEvent.setup();
    const host = mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    host.setAttribute("close-label", "Dismiss");
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
