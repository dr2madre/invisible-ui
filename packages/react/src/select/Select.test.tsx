import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Select } from "./Select";

const items = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
  { value: "fig", label: "Fig", disabled: true },
];

describe("React Select (styled)", () => {
  it("is a native select named by its label", () => {
    render(<Select label="Fruit" items={items} />);
    const el = screen.getByRole("combobox", { name: "Fruit" });
    expect(el.tagName).toBe("SELECT");
  });

  it("shows the placeholder while nothing is selected", () => {
    render(<Select label="Fruit" items={items} />);
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByRole("combobox")).toHaveClass("select__native--placeholder");
  });

  it("takes the placeholder from the locale catalog", () => {
    render(
      <LocaleProvider messages={{ "select.placeholder": "Scegli…" }}>
        <Select label="Frutta" items={items} />
      </LocaleProvider>,
    );
    expect(screen.getByText("Scegli…")).toBeInTheDocument();
  });

  it("renders every item, marking the disabled one", () => {
    render(<Select label="Fruit" items={items} />);
    expect(screen.getByRole("option", { name: "Apple" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Fig" })).toBeDisabled();
  });

  it("reports the chosen value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select label="Fruit" items={items} onValueChange={onValueChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "pear");
    expect(onValueChange).toHaveBeenCalledWith("pear");
  });

  it("reflects a controlled value", () => {
    render(<Select label="Fruit" items={items} value="pear" />);
    expect(screen.getByRole("combobox")).toHaveValue("pear");
    expect(screen.getByRole("combobox")).not.toHaveClass("select__native--placeholder");
  });

  it("announces the invalid state and links the message", () => {
    render(<Select label="Fruit" items={items} error="Pick a fruit" />);
    const el = screen.getByRole("combobox");
    expect(el).toHaveAttribute("aria-invalid", "true");
    expect(el).toHaveAccessibleDescription("Pick a fruit");
  });

  it("keeps the label accessible when visually hidden", () => {
    render(<Select label="Fruit" items={items} hideLabel />);
    expect(screen.getByRole("combobox", { name: "Fruit" })).toBeInTheDocument();
  });

  it("submits natively under its name", () => {
    render(<Select label="Fruit" items={items} name="fruit" value="apple" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("name", "fruit");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Select label="Fruit" items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
