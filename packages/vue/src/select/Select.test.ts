import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Select } from "./Select";

const items = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
  { value: "fig", label: "Fig", disabled: true },
];

describe("Vue Select (styled)", () => {
  it("is a native select named by its label", () => {
    render(Select, { props: { label: "Fruit", items } });
    const el = screen.getByRole("combobox", { name: "Fruit" });
    expect(el.tagName).toBe("SELECT");
  });

  it("shows the placeholder while nothing is selected", () => {
    render(Select, { props: { label: "Fruit", items } });
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByRole("combobox")).toHaveClass("select__native--placeholder");
  });

  it("takes the placeholder from the locale catalog", () => {
    render(LocaleProvider, {
      props: { messages: { "select.placeholder": "Scegli…" } },
      slots: { default: () => h(Select, { label: "Frutta", items }) },
    });
    expect(screen.getByText("Scegli…")).toBeInTheDocument();
  });

  it("renders every item, marking the disabled one", () => {
    render(Select, { props: { label: "Fruit", items } });
    expect(screen.getByRole("option", { name: "Apple" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Fig" })).toBeDisabled();
  });

  it("reports the chosen value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Select, { props: { label: "Fruit", items, onValueChange } });

    await user.selectOptions(screen.getByRole("combobox"), "pear");
    expect(onValueChange).toHaveBeenCalledWith("pear");
  });

  it("supports v-model: emits update:modelValue with the chosen value", async () => {
    const user = userEvent.setup();
    const { emitted } = render(Select, { props: { label: "Fruit", items, modelValue: null } });

    await user.selectOptions(screen.getByRole("combobox"), "pear");
    expect(emitted("update:modelValue")).toEqual([["pear"]]);
  });

  it("reflects a controlled value", () => {
    render(Select, { props: { label: "Fruit", items, value: "pear" } });
    expect(screen.getByRole("combobox")).toHaveValue("pear");
    expect(screen.getByRole("combobox")).not.toHaveClass("select__native--placeholder");
  });

  it("reflects a controlled v-model value", () => {
    render(Select, { props: { label: "Fruit", items, modelValue: "pear" } });
    expect(screen.getByRole("combobox")).toHaveValue("pear");
  });

  it("announces the invalid state and links the message", () => {
    render(Select, { props: { label: "Fruit", items, error: "Pick a fruit" } });
    const el = screen.getByRole("combobox");
    expect(el).toHaveAttribute("aria-invalid", "true");
    expect(el).toHaveAccessibleDescription("Pick a fruit");
  });

  it("keeps the label accessible when visually hidden", () => {
    render(Select, { props: { label: "Fruit", items, hideLabel: true } });
    expect(screen.getByRole("combobox", { name: "Fruit" })).toBeInTheDocument();
  });

  it("submits natively under its name", () => {
    render(Select, { props: { label: "Fruit", items, name: "fruit", value: "apple" } });
    expect(screen.getByRole("combobox")).toHaveAttribute("name", "fruit");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Select, { props: { label: "Fruit", items } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
