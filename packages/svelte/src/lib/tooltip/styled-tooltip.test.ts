import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./tooltip.fixture.svelte";

describe("Svelte Tooltip (styled)", () => {
  it("is hidden until the trigger is focused/hovered", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on focus, linking the trigger via aria-describedby, and hides on blur", async () => {
    const { container } = render(Fixture);
    const button = screen.getByRole("button", { name: "Copy" });

    await fireEvent.focusIn(button);
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Copy to clipboard");
    const trigger = container.querySelector(".tooltip__trigger")!;
    expect(trigger.getAttribute("aria-describedby")).toBe(tip.id);

    await fireEvent.focusOut(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("is dismissable with Escape", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await fireEvent.focusIn(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when shown", async () => {
    const { container } = render(Fixture);
    await fireEvent.focusIn(screen.getByRole("button", { name: "Copy" }));
    await screen.findByRole("tooltip");
    expect(await axe(container)).toHaveNoViolations();
  });
});
