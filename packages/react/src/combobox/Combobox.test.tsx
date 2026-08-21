import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Combobox, type ComboboxProps } from "./Combobox";

const items = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry", disabled: true },
];

const iconItems = [
  { value: "high", label: "High", icon: "M12 19V5m-7 7 7-7 7 7" },
  { value: "low", label: "Low", icon: "M12 5v14m7-7-7 7-7-7" },
];

const input = () => screen.getByRole("combobox");
const listbox = () => screen.getByRole("listbox");

/** Mirrors real usage: the parent owns the value, as in a controlled form. */
function Controlled(props: Partial<ComboboxProps> = {}) {
  const [value, setValue] = useState<string | null>(props.value ?? null);
  return (
    <Combobox
      label="Fruit"
      items={items}
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        props.onValueChange?.(next);
      }}
    />
  );
}

describe("React Combobox (styled)", () => {
  it("renders an editable combobox input, closed", () => {
    render(<Controlled />);
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveAttribute("aria-autocomplete", "list");
    expect(input()).toHaveAccessibleName("Fruit");
  });

  it("opens and filters as you type", async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    await user.type(input(), "ba");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    const options = within(listbox()).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Banana");
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.type(input(), "zzz");
    expect(within(listbox()).getByText("No results")).toBeInTheDocument();
  });

  it("selects an option on press, filling the input and closing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);

    await user.type(input(), "ban");
    await user.click(within(listbox()).getByRole("option", { name: "Banana" }));
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(input()).toHaveValue("Banana");
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("updates the input when the controlled value changes", () => {
    const { rerender } = render(<Combobox label="Fruit" items={items} value="apple" />);
    expect(input()).toHaveValue("Apple");

    rerender(<Combobox label="Fruit" items={items} value="banana" />);
    expect(input()).toHaveValue("Banana");

    rerender(<Combobox label="Fruit" items={items} value={null} />);
    expect(input()).toHaveValue("");
  });

  it("navigates with the keyboard and selects with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);

    input().focus();
    await user.keyboard("{ArrowDown}"); // opens, active = Apple
    await user.keyboard("{ArrowDown}"); // -> Banana
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(input()).toHaveValue("Banana");
  });

  it("tracks the highlighted option with aria-activedescendant", async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    input().focus();
    await user.keyboard("{ArrowDown}");
    const active = input().getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    // DOM focus never leaves the input: the highlight is conveyed by ARIA only.
    expect(document.activeElement).toBe(input());
    expect(document.getElementById(active!)).toHaveAttribute("data-active", "");
  });

  it("skips disabled options when arrowing, wrapping past them", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const activeText = () =>
      document.getElementById(input().getAttribute("aria-activedescendant")!)?.textContent;

    input().focus();
    await user.keyboard("{ArrowDown}"); // opens on Apple
    expect(activeText()).toContain("Apple");

    await user.keyboard("{ArrowDown}");
    expect(activeText()).toContain("Banana");

    // Cherry is disabled, so the next step skips it and wraps to the top.
    await user.keyboard("{ArrowDown}");
    expect(activeText()).toContain("Apple");
    expect(activeText()).not.toContain("Cherry");
  });

  it("does not select a disabled option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);

    await user.type(input(), "cher");
    await user.click(within(listbox()).getByRole("option", { name: "Cherry" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("clears the input via the clear button", async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    await user.type(input(), "app");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input()).toHaveValue("");
  });

  it("closes on Escape and puts the text back", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Fruit" items={items} value="banana" />);
    await user.clear(input());
    await user.type(input(), "a");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect((input() as HTMLInputElement).value).toBe("Banana");
  });

  it("puts the text back to the selection when focus leaves", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Fruit" items={items} value="banana" />);
    await user.clear(input());
    await user.type(input(), "ch");
    expect((input() as HTMLInputElement).value).toBe("ch");

    await user.tab();
    // "ch" was a filter, never a value: leaving must not imply it was chosen.
    expect((input() as HTMLInputElement).value).toBe("Banana");
  });

  it("empties a leftover filter when nothing was ever chosen", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Fruit" items={items} />);
    await user.type(input(), "ba");
    await user.tab();
    expect((input() as HTMLInputElement).value).toBe("");
  });

  it("closes when a pointer goes down outside", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Controlled />
        <button type="button">outside</button>
      </>,
    );
    await user.type(input(), "a");
    expect(input()).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("the chevron opens the full list even with a value selected", async () => {
    const user = userEvent.setup();
    render(<Controlled value="apple" />);

    await user.click(screen.getByRole("button", { name: "Show options" }));
    // Opening via the chevron ignores the current text: every option is shown,
    // so a chosen value can be changed without clearing it first.
    expect(within(listbox()).getAllByRole("option")).toHaveLength(3);
  });

  it("the chevron toggles the list closed again", async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    await user.click(screen.getByRole("button", { name: "Show options" }));
    expect(input()).toHaveAttribute("aria-expanded", "true");

    // Past the ghost-click window below, so this counts as a real second press.
    await new Promise((resolve) => setTimeout(resolve, 400));
    await user.click(screen.getByRole("button", { name: "Close options" }));
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores an iOS ghost click arriving right after the first", async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    // Two presses inside the 350ms window: the synthesized duplicate must not
    // close what the first press opened.
    await user.click(screen.getByRole("button", { name: "Show options" }));
    await user.click(screen.getByRole("button", { name: "Close options" }));
    expect(input()).toHaveAttribute("aria-expanded", "true");
  });

  it("submits the selected value under its name", async () => {
    const user = userEvent.setup();
    const { container } = render(<Controlled name="fruit" />);

    await user.type(input(), "ban");
    await user.click(within(listbox()).getByRole("option", { name: "Banana" }));
    expect(container.querySelector('input[type="hidden"][name="fruit"]')).toHaveValue("banana");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Controlled />);
    await user.type(input(), "a");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React Combobox (select-only — the advanced select)", () => {
  it("renders a read-only trigger that opens the full list on press", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Priority" items={iconItems} searchable={false} value="high" />);

    const trigger = screen.getByRole("combobox", { name: "Priority" });
    expect(trigger).toHaveAttribute("readonly");
    expect(trigger).toHaveValue("High");

    await user.click(trigger);
    // No filtering in select-only mode: every option is listed.
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("renders per-option icons and mirrors the selected one on the control", () => {
    const { container } = render(
      <Combobox label="Priority" items={iconItems} searchable={false} value="low" />,
    );
    expect(document.querySelectorAll(".combobox__option-icon").length).toBeGreaterThan(0);
    expect(container.querySelector(".combobox__search path")).not.toBeNull();
  });

  it("exposes the width mode as a data hook", () => {
    const { container } = render(<Combobox label="Priority" items={iconItems} width="wrap" />);
    expect(container.querySelector(".combobox")).toHaveAttribute("data-width", "wrap");
  });
});
