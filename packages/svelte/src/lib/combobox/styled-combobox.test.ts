import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./combobox.fixture.svelte";
import Combobox from "./Combobox.svelte";

const input = () => screen.getByRole("combobox");
const listbox = () => screen.getByRole("listbox");

describe("Svelte Combobox (styled, select-only)", () => {
  const iconItems = [
    { value: "high", label: "High", icon: "M12 19V5m-7 7 7-7 7 7" },
    { value: "low", label: "Low", icon: "M12 5v14m7-7-7 7-7-7" },
  ];

  it("renders a read-only trigger input that opens the full list on click", async () => {
    const user = userEvent.setup();
    render(Combobox, {
      props: { label: "Priority", items: iconItems, searchable: false, value: "high" },
    });
    const trigger = screen.getByRole("combobox", { name: "Priority" });
    expect(trigger).toHaveAttribute("readonly");
    expect(trigger).toHaveValue("High");
    await user.click(trigger);
    // No filtering in select-only mode: every option is listed.
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("renders per-option icons and mirrors the selected one on the control", () => {
    const { container } = render(Combobox, {
      props: { label: "Priority", items: iconItems, searchable: false, value: "low" },
    });
    expect(container.querySelectorAll(".combobox__option-icon").length).toBeGreaterThan(0);
    expect(container.querySelector(".combobox__search path")).not.toBeNull();
  });

  it("exposes the width mode as a data hook", () => {
    const { container } = render(Combobox, {
      props: { label: "Priority", items: iconItems, width: "wrap" },
    });
    expect(container.querySelector(".combobox")).toHaveAttribute("data-width", "wrap");
  });
});

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

  it("updates the input when the controlled value changes", async () => {
    const { rerender } = render(Fixture, { props: { value: "apple" } });
    expect(input()).toHaveValue("Apple");

    await rerender({ value: "banana" });
    expect(input()).toHaveValue("Banana");

    await rerender({ value: null });
    expect(input()).toHaveValue("");
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
