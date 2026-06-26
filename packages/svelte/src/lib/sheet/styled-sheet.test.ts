import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./sheet.fixture.svelte";

const overlay = () => document.querySelector<HTMLElement>(".sheet__overlay");

describe("Svelte Sheet (styled)", () => {
  it("is closed by default", () => {
    render(Fixture);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as an edge-anchored modal, named + described, focus moved in", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { side: "left" } });

    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("data-side", "left");
    expect(modal).toHaveAccessibleName("Filters");
    expect(modal).toHaveAccessibleDescription("Refine the results.");
    expect(modal.contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Open sheet" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on a backdrop press and via the close button", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    await fireEvent.pointerDown(overlay()!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("locks body scroll while open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
