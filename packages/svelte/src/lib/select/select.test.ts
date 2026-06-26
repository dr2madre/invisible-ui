import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Fixture from "./select.fixture.svelte";

describe("Svelte select (headless adapter)", () => {
  it("exposes a labelled combobox that is collapsed by default", () => {
    render(Fixture);
    const trigger = screen.getByRole("combobox", { name: /Fruit/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-state", "closed");
  });

  it("opens on click and highlights the first enabled option", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const trigger = screen.getByRole("combobox", { name: /Fruit/ });

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();
    // activedescendant points at the first enabled option (apple).
    const apple = screen.getByRole("option", { name: "Apple" });
    expect(trigger.getAttribute("aria-activedescendant")).toBe(apple.id);
  });

  it("selects an option on click and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });
    const trigger = screen.getByRole("combobox", { name: /Fruit/ });

    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Banana" }));
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("navigates with the keyboard, skipping disabled options", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });
    const trigger = screen.getByRole("combobox", { name: /Fruit/ });

    trigger.focus();
    await user.keyboard("{ArrowDown}"); // open, active = apple
    await user.keyboard("{ArrowDown}"); // apple -> banana
    await user.keyboard("{ArrowDown}"); // banana -> (cherry disabled) -> date
    await user.keyboard("{Enter}"); // select date
    expect(onValueChange).toHaveBeenCalledWith("date");
  });

  it("marks the selected option and disabled options", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { value: "apple" } });
    await user.click(screen.getByRole("combobox", { name: /Fruit/ }));

    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("aria-disabled", "true");
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { disabled: true } });
    const trigger = screen.getByRole("combobox", { name: /Fruit/ });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
