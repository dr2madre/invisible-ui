import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { tick } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./prompt-dialog.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte PromptDialog", () => {
  it("opens a named dialog with a labelled input seeded with the value", () => {
    render(Fixture, { props: { open: true } });
    expect(screen.getByRole("dialog", { name: "Rename file" })).toBeInTheDocument();
    expect(screen.getByLabelText("File name")).toHaveValue("report");
  });

  it("confirms with the edited value and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(Fixture, { props: { open: true, onConfirm } });
    const input = screen.getByLabelText("File name");
    await user.clear(input);
    await user.type(input, "summary");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledWith("summary");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("gates confirm until the input matches confirmValue (type-to-confirm)", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(Fixture, {
      props: { open: true, value: "", confirmValue: "report-2026.pdf", onConfirm },
    });
    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    expect(confirmBtn).toBeDisabled();
    await user.type(screen.getByLabelText("File name"), "report-2026.pdf");
    expect(confirmBtn).toBeEnabled();
    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith("report-2026.pdf");
  });

  it("cancels without reporting a value", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(Fixture, { props: { open: true, onConfirm } });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("urgent switches the role to alertdialog and keeps the input focused", async () => {
    render(Fixture, { props: { open: true, urgent: true } });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog", { name: "Rename file" })).toBeInTheDocument();
    await tick();
    expect(screen.getByLabelText("File name")).toHaveFocus();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(Fixture, { props: { open: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
