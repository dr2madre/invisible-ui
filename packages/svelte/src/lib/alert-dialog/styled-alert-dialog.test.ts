import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./alert-dialog.fixture.svelte";

const overlay = () => document.querySelector<HTMLElement>(".alert-dialog__overlay");
const openIt = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Delete file" }));

describe("Svelte AlertDialog (styled)", () => {
  it("is closed by default", () => {
    render(Fixture);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens as an alertdialog, named + described, focus on Cancel", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await openIt(user);
    const modal = screen.getByRole("alertdialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAccessibleName("Delete file?");
    expect(modal).toHaveAccessibleDescription("This action cannot be undone.");
    // The least-destructive action (Cancel) takes initial focus.
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("does NOT close on a backdrop press", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openIt(user);

    await fireEvent.pointerDown(overlay()!);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("Escape cancels and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(Fixture, { props: { onAction } });
    const trigger = screen.getByRole("button", { name: "Delete file" });

    await openIt(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it("Cancel closes without running the action", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(Fixture, { props: { onAction } });

    await openIt(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("the action runs onAction and closes", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(Fixture, { props: { onAction } });

    await openIt(user);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openIt(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
