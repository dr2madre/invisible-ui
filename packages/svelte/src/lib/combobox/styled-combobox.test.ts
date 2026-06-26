import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./combobox.fixture.svelte";

const input = () => screen.getByRole("combobox");
const listbox = () => screen.getByRole("listbox");

describe("Svelte Combobox (styled)", () => {
  it("renders an editable combobox input, closed", () => {
    render(Fixture);
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveAttribute("aria-autocomplete", "list");
  });

  it("opens and filters as you type", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.type(input(), "ba");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    const options = within(listbox()).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Banana");
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.type(input(), "zzz");
    expect(within(listbox()).getByText("No results")).toBeInTheDocument();
  });

  it("selects an option on click, filling the input and closing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });

    await user.type(input(), "ban");
    await user.click(within(listbox()).getByRole("option", { name: "Banana" }));
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(input()).toHaveValue("Banana");
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("navigates with the keyboard and selects with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });

    input().focus();
    await user.keyboard("{ArrowDown}"); // open, active = Apple
    await user.keyboard("{ArrowDown}"); // -> Banana
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(input()).toHaveValue("Banana");
  });

  it("does not select a disabled option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });

    await user.type(input(), "cher");
    await user.click(within(listbox()).getByRole("option", { name: "Cherry" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("clears the input via the clear button", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.type(input(), "app");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input()).toHaveValue("");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.type(input(), "a");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(Fixture);
    await user.type(input(), "a");
    expect(await axe(container)).toHaveNoViolations();
  });
});
