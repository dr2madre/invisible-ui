import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PromptDialog } from "./PromptDialog";

const renderPrompt = (props: Record<string, unknown> = {}) =>
  render(PromptDialog, {
    props: {
      title: "Rename file",
      label: "File name",
      value: "report",
      trigger: "Rename",
      ...props,
    },
  });

const openIt = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Rename" }));

describe("Vue PromptDialog (styled)", () => {
  it("opens a named dialog with a labelled input seeded with the value, focused", async () => {
    const user = userEvent.setup();
    renderPrompt();

    await openIt(user);
    expect(screen.getByRole("dialog", { name: "Rename file" })).toBeInTheDocument();
    const input = screen.getByLabelText("File name");
    expect(input).toHaveValue("report");
    expect(input).toHaveFocus();
  });

  it("confirms with the edited value and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderPrompt({ onConfirm });

    await openIt(user);
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
    renderPrompt({ onConfirm });

    await openIt(user);
    await user.type(screen.getByLabelText("File name"), "-q3{Enter}");
    expect(onConfirm).toHaveBeenCalledWith("report-q3");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("gates confirm until the input matches confirmValue (type-to-confirm)", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderPrompt({ value: "", confirmValue: "report-2026.pdf", onConfirm });

    await openIt(user);
    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    expect(confirmBtn).toBeDisabled();
    await user.type(screen.getByLabelText("File name"), "report-2026.pdf");
    expect(confirmBtn).toBeEnabled();
    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith("report-2026.pdf");
  });

  it("requires a non-empty value when required", async () => {
    const user = userEvent.setup();
    renderPrompt({ value: "", required: true });

    await openIt(user);
    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    expect(confirmBtn).toBeDisabled();
    await user.type(screen.getByLabelText("File name"), "summary");
    expect(confirmBtn).toBeEnabled();
  });

  it("cancels without reporting a value", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderPrompt({ onConfirm });

    await openIt(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("urgent switches the role to alertdialog and keeps the input focused", async () => {
    const user = userEvent.setup();
    renderPrompt({ urgent: true });

    await openIt(user);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog", { name: "Rename file" })).toBeInTheDocument();
    expect(screen.getByLabelText("File name")).toHaveFocus();
  });

  it("reseeds the input from the value on each open", async () => {
    const user = userEvent.setup();
    renderPrompt();

    await openIt(user);
    await user.type(screen.getByLabelText("File name"), "-draft");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await openIt(user);
    expect(screen.getByLabelText("File name")).toHaveValue("report");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    renderPrompt();
    await openIt(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
