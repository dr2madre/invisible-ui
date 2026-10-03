import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PromptDialog } from "./PromptDialog";

const Prompt = (props: Partial<ComponentProps<typeof PromptDialog>>) => (
  <PromptDialog title="Rename file" label="File name" value="report" trigger="Rename" {...props} />
);

describe("React PromptDialog", () => {
  it("opens a named dialog with a labelled input seeded with the value, focused", () => {
    render(<Prompt open />);
    expect(screen.getByRole("dialog", { name: "Rename file" })).toBeInTheDocument();
    const input = screen.getByLabelText("File name");
    expect(input).toHaveValue("report");
    expect(input).toHaveFocus();
  });

  it("confirms with the edited value and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Prompt open onConfirm={onConfirm} />);
    const input = screen.getByLabelText("File name");
    await user.clear(input);
    await user.type(input, "summary");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledWith("summary");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirms with Enter in the field", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Prompt open onConfirm={onConfirm} />);
    await user.type(screen.getByLabelText("File name"), "-v2{Enter}");
    expect(onConfirm).toHaveBeenCalledWith("report-v2");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("gates confirm until the input matches confirmValue (type-to-confirm)", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Prompt open value="" confirmValue="report-2026.pdf" onConfirm={onConfirm} />);
    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    expect(confirmButton).toBeDisabled();

    // Enter does not get past the gate either.
    await user.type(screen.getByLabelText("File name"), "report{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("File name"), "-2026.pdf");
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledWith("report-2026.pdf");
  });

  it("keeps confirm disabled while a required value is blank", async () => {
    const user = userEvent.setup();
    render(<Prompt open value="" required />);
    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    expect(confirmButton).toBeDisabled();
    await user.type(screen.getByLabelText("File name"), "   ");
    expect(confirmButton).toBeDisabled();
    await user.type(screen.getByLabelText("File name"), "a");
    expect(confirmButton).toBeEnabled();
  });

  it("cancels without reporting a value", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Prompt open onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("starts each opening from the value again", async () => {
    const user = userEvent.setup();
    render(<Prompt />);
    await user.click(screen.getByRole("button", { name: "Rename" }));
    await user.type(screen.getByLabelText("File name"), "-draft");
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Rename" }));
    expect(screen.getByLabelText("File name")).toHaveValue("report");
  });

  it("urgent switches the role to alertdialog and keeps the input focused", () => {
    render(<Prompt open urgent />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog", { name: "Rename file" })).toBeInTheDocument();
    expect(screen.getByLabelText("File name")).toHaveFocus();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(<Prompt open description="Use letters and digits." />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
