import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./navigation-menu.fixture.svelte";

const trigger = (name: string) => screen.getByRole("button", { name });

describe("Svelte NavigationMenu (styled)", () => {
  it("renders a nav landmark with triggers and plain links", () => {
    render(Fixture);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "#pricing");
  });

  it("opens a panel on click and reveals its links", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });

    await user.click(trigger("Products"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("products");
    expect(screen.getByRole("link", { name: /Analytics/ })).toBeInTheDocument();
  });

  it("switches panels immediately on hover while open", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(trigger("Products"));
    await fireEvent.pointerEnter(trigger("Company"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Company")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /About/ })).toBeInTheDocument();
  });

  it("opens with ArrowDown and moves focus into the panel", async () => {
    const user = userEvent.setup();
    render(Fixture);

    trigger("Products").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Analytics/ })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);

    trigger("Products").focus();
    await user.keyboard("{ArrowDown}"); // open + focus first link
    await user.keyboard("{Escape}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Products")).toHaveFocus();
  });

  it("closes on an outside press", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(trigger("Products"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    await fireEvent.pointerDown(document.body);
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations", async () => {
    const user = userEvent.setup();
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(trigger("Products"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
