import { fireEvent, render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./dialog.fixture.svelte";
import NestedFixture from "./dialog-nested.fixture.svelte";
import WorkflowFixture from "./dialog-workflow.fixture.svelte";

// Native <dialog>: backdrop presses target the element itself with
// coordinates outside its box.
const pressBackdrop = (panel: HTMLElement) =>
  fireEvent.pointerDown(panel, { clientX: -10, clientY: -10 });

describe("Svelte Dialog (styled)", () => {
  it("is closed by default with the trigger advertising the dialog", () => {
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a modal, named and described, with focus moved inside", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Fixture, { props: { onOpenChange } });

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const modal = screen.getByRole("dialog");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAccessibleName("Edit profile");
    expect(modal).toHaveAccessibleDescription("Update your details.");
    // Focus moved into the panel.
    expect(modal.contains(document.activeElement)).toBe(true);
  });

  it("opens and closes when the open prop changes", async () => {
    const { rerender } = render(Fixture, { props: { open: false } });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await rerender({ open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await rerender({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open dialog" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on a backdrop press", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await pressBackdrop(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a native <dialog> shown modally (inert background is the browser's)", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const panel = screen.getByRole("dialog");
    expect(panel.tagName).toBe("DIALOG");
    expect((panel as HTMLDialogElement).open).toBe(true);
  });

  it("stacks a confirm dialog on top; Escape closes only the innermost", async () => {
    const user = userEvent.setup();
    render(NestedFixture);
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    const outer = screen.getByRole("dialog", { name: "Edit profile" });

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getByRole("dialog", { name: "Discard changes?" })).toBeInTheDocument();
    expect(outer).toBeInTheDocument();

    // Escape pops the stack one level: the confirm closes, the editor stays,
    // focus returns inside it and the body stays scroll-locked.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Discard changes?" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Edit profile" })).toBeInTheDocument();
    expect(outer.contains(document.activeElement)).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

// A multi-step workflow is a composition of the dialog's regions. The step
// state stays in the application; the dialog only lends the places to put it.
describe("Svelte Dialog (workflow composition)", () => {
  const panel = () => screen.getByRole("dialog");

  it("renders header metadata before the title, without progress semantics", () => {
    render(WorkflowFixture, { props: { open: true } });
    const meta = panel().querySelector(".dialog__header-meta")!;
    const title = panel().querySelector(".dialog__title")!;

    expect(meta).toHaveTextContent("Step 1 of 2");
    expect(meta.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(meta).not.toHaveAttribute("role");
    expect(meta).not.toHaveAttribute("aria-live");
    // The metadata does not take part in naming the dialog.
    expect(panel()).toHaveAccessibleName("Set up project");
  });

  it("keeps one footer action bar, leading actions first in source order", async () => {
    render(WorkflowFixture, { props: { open: true, step: 2 } });
    const footers = panel().querySelectorAll("footer");
    expect(footers).toHaveLength(1);

    const buttons = Array.from(footers[0]!.querySelectorAll("button")).map((b) =>
      b.textContent?.trim(),
    );
    expect(buttons).toEqual(["Back", "Close", "Create project"]);
  });

  it("keeps footerClose working alongside footerLead", async () => {
    const user = userEvent.setup();
    render(WorkflowFixture, { props: { open: true, step: 2 } });
    // The header close carries the same label, so scope to the footer group.
    const footerClose = within(
      panel().querySelector<HTMLElement>(".dialog__footer-lead")!,
    ).getByRole("button", { name: "Close" });

    await user.click(footerClose);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers a visible dismissal control at every step", async () => {
    const { rerender } = render(WorkflowFixture, { props: { open: true, step: 1 } });
    const dismissals = () => screen.getAllByRole("button", { name: "Close" });
    // The header close and the footer close are both real, focusable buttons.
    expect(dismissals().length).toBeGreaterThan(0);
    dismissals().forEach((button) => expect(button).toBeVisible());

    await rerender({ open: true, step: 2 });
    expect(dismissals().length).toBeGreaterThan(0);
    dismissals().forEach((button) => expect(button).toBeVisible());
  });

  it("moves focus to the new step heading, never leaving it on a removed control", async () => {
    const user = userEvent.setup();
    render(WorkflowFixture, { props: { open: true } });

    await user.click(screen.getByRole("button", { name: "Continue" }));
    const heading = screen.getByRole("heading", { name: "Name the project" });
    expect(heading).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Choose a template" })).toHaveFocus();
  });

  it("stacks the body sections and keeps the body the only scrolling region", () => {
    render(WorkflowFixture, { props: { open: true } });
    const body = panel().querySelector(".dialog__body")!;

    expect(body).toHaveAttribute("data-layout", "stack");
    // Header and footer are siblings of the body, so they stay put while it scrolls.
    expect(panel().querySelector(":scope > header")).not.toBeNull();
    expect(panel().querySelector(":scope > footer")).not.toBeNull();
    expect(body.parentElement).toBe(panel());
  });

  it("leaves the body untouched by default", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(panel().querySelector(".dialog__body")).toHaveAttribute("data-layout", "plain");
    expect(panel().querySelector(".dialog__header-meta")).toBeNull();
    expect(panel().querySelector(".dialog__footer-lead")).toBeNull();
  });

  it("has no accessibility violations at either step", async () => {
    const { rerender } = render(WorkflowFixture, { props: { open: true, step: 1 } });
    expect(await axe(document.body)).toHaveNoViolations();

    await rerender({ open: true, step: 2 });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
