import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { tick } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./confirm-dialog.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte ConfirmDialog", () => {
  it("opens a named dialog from the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Discard" }));
    const dialog = screen.getByRole("dialog", { name: "Discard changes?" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Your edits will be lost.")).toBeInTheDocument();
  });

  it("confirms and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(Fixture, { props: { open: true, onConfirm } });
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(Fixture, { props: { open: true, onConfirm } });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("urgent switches the role to alertdialog and nothing else", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { open: true, urgent: true } });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const modal = screen.getByRole("alertdialog", { name: "Discard changes?" });
    expect(modal).toHaveAttribute("aria-modal", "true");
    // Same two buttons, same safe-choice focus.
    await tick();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  // Svelte re-applies a prop's initializer when `undefined` is passed, so the
  // fixture models "no description" with an empty string.
  it("omits aria-describedby when there is no description", () => {
    render(Fixture, { props: { open: true, description: "" } });
    const dialog = screen.getByRole("dialog", { name: "Discard changes?" });
    expect(dialog).not.toHaveAttribute("aria-describedby");
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(Fixture, { props: { open: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });

  it("has no accessibility violations without a description", async () => {
    const { container } = render(Fixture, { props: { open: true, description: "" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
