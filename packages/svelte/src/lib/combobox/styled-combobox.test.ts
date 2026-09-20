import { fireEvent, render, screen, within } from "@testing-library/svelte";
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
    expect(document.querySelectorAll(".combobox__option-icon").length).toBeGreaterThan(0);
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

  it("puts the text back to the selection when focus leaves", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: "banana", onValueChange } });
    await user.clear(input());
    await user.type(input(), "ch");
    expect((input() as HTMLInputElement).value).toBe("ch");

    await user.tab();
    // "ch" was a filter, never a value: leaving must not imply it was chosen.
    expect((input() as HTMLInputElement).value).toBe("Banana");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    // Nothing was selected, so no value was reported.
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("empties a leftover filter when nothing was ever chosen", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.type(input(), "ba");
    await user.tab();
    expect((input() as HTMLInputElement).value).toBe("");
  });

  it("keeps the chosen label when the pointer picks an option", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.type(input(), "ba");
    // Selecting runs on pointer-down, before focus moves: the revert that
    // follows must not undo the selection.
    await user.click(screen.getByRole("option", { name: "Banana" }));
    await user.tab();
    expect((input() as HTMLInputElement).value).toBe("Banana");
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

  it("a control turned off closes the list it had open", async () => {
    const user = userEvent.setup();
    const { rerender } = render(Fixture, { props: { disabled: false } });
    await user.type(input(), "b");
    expect(input()).toHaveAttribute("aria-expanded", "true");

    // The input becomes natively disabled, so it takes no key: a list left
    // open over it could only be dismissed with a pointer.
    await rerender({ disabled: true });
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(listbox()).toHaveAttribute("data-state", "closed");
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

  // A selection, not typed text: moving focus to the clear button blurs the
  // input, and the combobox puts unselected text back to what was committed.
  // Starting from a chosen value means an empty input can only be the clear
  // button's doing; with typed text these would pass against a dead button.
  it.each(["{Enter}", " "])(
    "clears from the keyboard with %s, and hands focus back",
    async (key) => {
      const user = userEvent.setup();
      render(Fixture, { props: { value: "banana" } });
      expect(input()).toHaveValue("Banana");

      const clear = screen.getByRole("button", { name: "Clear" });
      expect(clear, "reachable while there is something to clear").toHaveAttribute("tabindex", "0");
      clear.focus();
      expect(clear).toHaveFocus();

      await user.keyboard(key);

      expect(input()).toHaveValue("");
      // The button it pressed is out of the tree now, so focus cannot stay.
      expect(input()).toHaveFocus();
    },
  );

  it("clears on a direct click with no mousedown before it, and hands focus back", async () => {
    // Assistive activation may dispatch a click on its own, with no pointer
    // press and no key before it. The click has to be enough by itself.
    render(Fixture, { props: { value: "banana" } });
    expect(input()).toHaveValue("Banana");

    await fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(input()).toHaveValue("");
    expect(input()).toHaveFocus();
  });

  it("a pointer press clears once and reports once", async () => {
    // mousedown keeps focus on the input, the click does the clearing: the
    // two must add up to one clear, not two.
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: "banana", onValueChange } });

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(input()).toHaveValue("");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(input()).toHaveFocus();
  });

  it("offers no clear button at all while there is nothing to clear", () => {
    const { container } = render(Fixture);
    // It keeps its footprint so the input does not jump, but it is out of the
    // accessibility tree and out of the tab sequence.
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    const clear = container.querySelector(".combobox__clear") as HTMLElement;
    expect(clear).toHaveAttribute("tabindex", "-1");
  });

  it("closes on Escape and puts the text back", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { value: "banana" } });
    await user.clear(input());
    await user.type(input(), "a");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect((input() as HTMLInputElement).value).toBe("Banana");
  });

  it("leaves Escape alone while the list is closed, so an outer layer sees it", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const { container } = render(Fixture, { props: { value: "banana" } });
    container.addEventListener("keydown", onKeyDown);
    input().focus();
    await user.keyboard("{Escape}");
    // Nothing to close and nothing to undo: the key belongs to whatever wraps
    // the combobox, a dialog for instance.
    expect(onKeyDown).toHaveBeenCalled();
    expect(onKeyDown.mock.calls[0]![0].defaultPrevented).toBe(false);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(Fixture);
    await user.type(input(), "a");
    expect(await axe(container)).toHaveNoViolations();
  });
});
