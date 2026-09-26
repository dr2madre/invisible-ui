import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsPromptDialog } from "./ds-prompt-dialog";

const mount = (attributes = `value="report"`) => {
  document.body.innerHTML = `
    <ds-prompt-dialog heading="Rename file" label="File name" trigger="Rename" ${attributes}>
    </ds-prompt-dialog>`;
  const host = document.querySelector("ds-prompt-dialog") as DsPromptDialog;
  const onConfirm = vi.fn();
  host.addEventListener("confirm", (e) => onConfirm((e as CustomEvent).detail));
  return { host, onConfirm };
};

describe("<ds-prompt-dialog>", () => {
  it("opens a named dialog with a labelled input seeded with the value and focused", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Rename" }));
    expect(screen.getByRole("dialog", { name: "Rename file" })).toBeInTheDocument();
    const input = screen.getByLabelText("File name");
    expect(input).toHaveValue("report");
    expect(input).toHaveFocus();
  });

  it("confirms with the edited value and closes", async () => {
    const user = userEvent.setup();
    const { host, onConfirm } = mount();
    host.open = true;
    const input = screen.getByLabelText("File name");
    await user.clear(input);
    await user.type(input, "summary");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledWith({ value: "summary" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Enter in the input confirms", async () => {
    const user = userEvent.setup();
    const { host, onConfirm } = mount();
    host.open = true;
    await user.type(screen.getByLabelText("File name"), "-final{Enter}");
    expect(onConfirm).toHaveBeenCalledWith({ value: "report-final" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("gates confirm until the input matches confirm-value (type to confirm)", async () => {
    const user = userEvent.setup();
    const { host, onConfirm } = mount(`confirm-value="report-2026.pdf"`);
    host.open = true;
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();

    // Enter does nothing while the gate is closed.
    await user.type(screen.getByLabelText("File name"), "report{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("File name"), "-2026.pdf");
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({ value: "report-2026.pdf" });
  });

  it("required keeps confirm disabled while the value is blank", async () => {
    const user = userEvent.setup();
    const { host } = mount(`required`);
    host.open = true;
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("File name"), "   ");
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("File name"), "notes");
    expect(confirm).toBeEnabled();
  });

  it("cancels without reporting a value, and reseeds the input on the next opening", async () => {
    const user = userEvent.setup();
    const { host, onConfirm } = mount();
    const trigger = screen.getByRole("button", { name: "Rename" });
    await user.click(trigger);
    await user.type(screen.getByLabelText("File name"), "-draft");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    host.open = true;
    expect(screen.getByLabelText("File name")).toHaveValue("report");
  });

  it("Escape cancels", async () => {
    const user = userEvent.setup();
    const { host, onConfirm } = mount();
    host.open = true;
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("urgent switches the role to alertdialog and keeps the input focused", () => {
    const { host } = mount(`value="report" urgent`);
    host.open = true;
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog", { name: "Rename file" })).toBeInTheDocument();
    expect(screen.getByLabelText("File name")).toHaveFocus();
  });

  it("has no close button by default and shows one on request", async () => {
    const user = userEvent.setup();
    const { host } = mount(`value="report" close-button`);
    host.open = true;
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    host.removeAttribute("close-button");
    host.open = true;
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const { host } = mount(`value="report" description="Use letters and digits."`);
    host.open = true;
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
