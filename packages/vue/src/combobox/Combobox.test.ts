import { render, screen, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { nextTick } from "vue";
import { LocaleProvider } from "../i18n/i18n";
import { Combobox, type ComboboxOption } from "./Combobox";

const items: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry", disabled: true },
];

const iconItems: ComboboxOption[] = [
  { value: "high", label: "High", icon: "M12 19V5m-7 7 7-7 7 7" },
  { value: "low", label: "Low", icon: "M12 5v14m7-7-7 7-7-7" },
];

const input = () => screen.getByRole("combobox");
const listbox = () => screen.getByRole("listbox");
const activeOption = () =>
  document.getElementById(input().getAttribute("aria-activedescendant") ?? "");

/** Mirrors real usage: the parent owns the value, as in a controlled form. */
const Controlled = defineComponent({
  props: {
    initialValue: { type: String, default: null },
    onValueChange: { type: Function, default: undefined },
    name: { type: String, default: undefined },
  },
  setup(props) {
    const value = ref<string | null>(props.initialValue);
    return () =>
      h(Combobox, {
        label: "Fruit",
        items,
        name: props.name,
        value: value.value,
        onValueChange: (next: string | null) => {
          value.value = next;
          props.onValueChange?.(next);
        },
      });
  },
});

describe("Vue Combobox (styled)", () => {
  it("renders an editable combobox input, closed", () => {
    render(Controlled);
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveAttribute("aria-autocomplete", "list");
    expect(input()).toHaveAccessibleName("Fruit");
  });

  it("opens and filters as you type", async () => {
    const user = userEvent.setup();
    render(Controlled);

    await user.type(input(), "ba");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    const options = within(listbox()).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Banana");
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(Controlled);
    await user.type(input(), "zzz");
    expect(within(listbox()).getByText("No results")).toBeInTheDocument();
  });

  it("takes its default labels from the locale catalog", async () => {
    const user = userEvent.setup();
    render(LocaleProvider, {
      props: {
        messages: {
          "combobox.placeholder": "Cerca…",
          "combobox.clear": "Svuota",
          "combobox.empty": "Nessun risultato",
        },
      },
      slots: { default: () => h(Combobox, { label: "Frutta", items }) },
    });
    expect(input()).toHaveAttribute("placeholder", "Cerca…");

    // The clear button is hidden from assistive tech while the input is empty.
    await user.type(input(), "zzz");
    expect(screen.getByRole("button", { name: "Svuota" })).toBeInTheDocument();
    expect(within(listbox()).getByText("Nessun risultato")).toBeInTheDocument();
  });

  it("selects an option on press, filling the input and closing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Controlled, { props: { onValueChange } });

    await user.type(input(), "ban");
    await user.click(within(listbox()).getByRole("option", { name: "Banana" }));
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(input()).toHaveValue("Banana");
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("updates the input when the controlled value changes", async () => {
    const { rerender } = render(Combobox, { props: { label: "Fruit", items, value: "apple" } });
    expect(input()).toHaveValue("Apple");

    await rerender({ label: "Fruit", items, value: "banana" });
    expect(input()).toHaveValue("Banana");

    await rerender({ label: "Fruit", items, value: null });
    expect(input()).toHaveValue("");
  });

  it("supports v-model: emits update:modelValue with the chosen value", async () => {
    const user = userEvent.setup();
    const { emitted } = render(Combobox, {
      props: { label: "Fruit", items, modelValue: null },
    });

    await user.type(input(), "ban");
    await user.click(within(listbox()).getByRole("option", { name: "Banana" }));
    expect(emitted("update:modelValue")).toEqual([["banana"]]);
  });

  it("reflects a controlled v-model value", () => {
    render(Combobox, { props: { label: "Fruit", items, modelValue: "cherry" } });
    expect(input()).toHaveValue("Cherry");
  });

  it("navigates with the keyboard and selects with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Controlled, { props: { onValueChange } });

    input().focus();
    await user.keyboard("{ArrowDown}"); // opens, active = Apple
    await user.keyboard("{ArrowDown}"); // -> Banana
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(input()).toHaveValue("Banana");
  });

  it("tracks the highlighted option with aria-activedescendant", async () => {
    const user = userEvent.setup();
    render(Controlled);

    input().focus();
    await user.keyboard("{ArrowDown}");
    expect(input().getAttribute("aria-activedescendant")).toBeTruthy();
    // DOM focus never leaves the input: the highlight is conveyed by ARIA only.
    expect(document.activeElement).toBe(input());
    expect(activeOption()).toHaveAttribute("data-active", "");
  });

  it("keeps each option element across highlight changes", async () => {
    const user = userEvent.setup();
    render(Controlled);

    input().focus();
    await user.keyboard("{ArrowDown}"); // opens on Apple
    const apple = within(listbox()).getByRole("option", { name: "Apple" });

    await user.keyboard("{ArrowDown}"); // -> Banana
    // Keyed rendering reuses the node. A node replaced between pointerdown and
    // pointerup would swallow the press that selects it.
    expect(within(listbox()).getByRole("option", { name: "Apple" })).toBe(apple);
  });

  it("skips disabled options when arrowing, wrapping past them", async () => {
    const user = userEvent.setup();
    render(Controlled);

    input().focus();
    await user.keyboard("{ArrowDown}"); // opens on Apple
    expect(activeOption()?.textContent).toContain("Apple");

    await user.keyboard("{ArrowDown}");
    expect(activeOption()?.textContent).toContain("Banana");

    // Cherry is disabled, so the next step skips it and wraps to the top.
    await user.keyboard("{ArrowDown}");
    expect(activeOption()?.textContent).toContain("Apple");
    expect(activeOption()?.textContent).not.toContain("Cherry");
  });

  it("does not select a disabled option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Controlled, { props: { onValueChange } });

    await user.type(input(), "cher");
    await user.click(within(listbox()).getByRole("option", { name: "Cherry" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("clears the input via the clear button", async () => {
    const user = userEvent.setup();
    render(Controlled);

    await user.type(input(), "app");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input()).toHaveValue("");
  });

  it("closes on Escape and puts the text back", async () => {
    const user = userEvent.setup();
    render(Combobox, { props: { label: "Fruit", items, value: "banana" } });
    await user.clear(input());
    await user.type(input(), "a");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect((input() as HTMLInputElement).value).toBe("Banana");
  });

  it("puts the text back to the selection when focus leaves", async () => {
    const user = userEvent.setup();
    render(Combobox, { props: { label: "Fruit", items, value: "banana" } });
    await user.clear(input());
    await user.type(input(), "ch");
    expect((input() as HTMLInputElement).value).toBe("ch");

    await user.tab();
    // "ch" was a filter, never a value: leaving must not imply it was chosen.
    expect((input() as HTMLInputElement).value).toBe("Banana");
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("empties a leftover filter when nothing was ever chosen", async () => {
    const user = userEvent.setup();
    render(Combobox, { props: { label: "Fruit", items } });
    await user.type(input(), "ba");
    await user.tab();
    expect((input() as HTMLInputElement).value).toBe("");
  });

  it("keeps the chosen label when the pointer picks an option", async () => {
    const user = userEvent.setup();
    render(Combobox, { props: { label: "Fruit", items } });
    await user.type(input(), "ba");
    // Selecting runs on pointer-down, before focus moves: the revert that
    // follows must not undo the selection.
    await user.click(screen.getByRole("option", { name: "Banana" }));
    await user.tab();
    expect((input() as HTMLInputElement).value).toBe("Banana");
  });

  it("closes when a pointer goes down outside", async () => {
    const user = userEvent.setup();
    render(
      defineComponent({
        setup: () => () => [h(Controlled), h("button", { type: "button" }, "outside")],
      }),
    );
    await user.type(input(), "a");
    expect(input()).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("the chevron opens the full list even with a value selected", async () => {
    const user = userEvent.setup();
    render(Controlled, { props: { initialValue: "apple" } });

    await user.click(screen.getByRole("button", { name: "Show options" }));
    // Opening via the chevron ignores the current text: every option is shown,
    // so a chosen value can be changed without clearing it first.
    expect(within(listbox()).getAllByRole("option")).toHaveLength(3);
  });

  it("the chevron toggles the list closed again", async () => {
    const user = userEvent.setup();
    render(Controlled);

    // Mouse presses always count, however quick: the ghost guard arms only
    // after touch input.
    await user.click(screen.getByRole("button", { name: "Show options" }));
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Close options" }));
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores an iOS ghost click arriving right after a tap", async () => {
    render(Controlled);
    const chevron = screen.getByRole("button", { name: "Show options" });

    // A tap: touch pointerdown, then the click the browser derives from it.
    // (jsdom has no PointerEvent constructor; a MouseEvent with the field
    // defined carries the same information to the handler.)
    const tap = new MouseEvent("pointerdown", { bubbles: true });
    Object.defineProperty(tap, "pointerType", { value: "touch" });
    chevron.dispatchEvent(tap);
    chevron.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(input()).toHaveAttribute("aria-expanded", "true");

    // The synthesized duplicate arrives inside the window with no fresh
    // press: it must not close what the tap opened.
    chevron.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(input()).toHaveAttribute("aria-expanded", "true");
  });

  it("submits the selected value under its name", async () => {
    const user = userEvent.setup();
    const { container } = render(Controlled, { props: { name: "fruit" } });

    await user.type(input(), "ban");
    await user.click(within(listbox()).getByRole("option", { name: "Banana" }));
    expect(container.querySelector('input[type="hidden"][name="fruit"]')).toHaveValue("banana");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(Controlled);
    await user.type(input(), "a");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Vue Combobox (select-only, the advanced select)", () => {
  it("renders a read-only trigger that opens the full list on press", async () => {
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
