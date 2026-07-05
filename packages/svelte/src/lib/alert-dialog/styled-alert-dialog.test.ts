import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./alert-dialog.fixture.svelte";

const overlay = () => document.querySelector<HTMLElement>(".alert-dialog__overlay");
const openIt = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Show alert" }));

describe("Svelte AlertDialog (styled)", () => {
  it("is closed by default", () => {
    render(Fixture);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens as an alertdialog, named + described, focus on the only button", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await openIt(user);
    const modal = screen.getByRole("alertdialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAccessibleName("File deleted");
    expect(modal).toHaveAccessibleDescription("“report-q3.pdf” was permanently deleted.");
    expect(screen.getByRole("button", { name: "OK" })).toHaveFocus();
  });

  it("renders exactly one action button", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openIt(user);
    const modal = screen.getByRole("alertdialog");
    expect(modal.querySelectorAll("button")).toHaveLength(1);
  });

  it("the button acknowledges: onDismiss runs and it closes", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(Fixture, { props: { onDismiss } });

    await openIt(user);
    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Escape is equivalent to the button and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(Fixture, { props: { onDismiss } });
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
    render(Fixture, { props: { onDismiss } });
    await openIt(user);

    await fireEvent.pointerDown(overlay()!);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("keeps open on a backdrop press when closeOnOutsideClick is false", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { closeOnOutsideClick: false } });
    await openIt(user);

    await fireEvent.pointerDown(overlay()!);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("accepts a contextual dismiss label", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { dismissLabel: "I understood" } });
    await openIt(user);
    expect(screen.getByRole("button", { name: "I understood" })).toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openIt(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
