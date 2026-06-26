import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import RadioGroup from "./RadioGroup.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

describe("Svelte RadioGroup (styled)", () => {
  it("renders a named group with the selected item checked", () => {
    render(RadioGroup, { props: { items, label: "Size", value: "medium" } });
    expect(screen.getByRole("radiogroup", { name: "Size" })).toBeInTheDocument();

    const medium = screen.getByRole("radio", { name: "Medium" });
    expect(medium).toHaveAttribute("data-state", "checked");
    expect(medium).toBeChecked();
  });

  it("selects on click and reports the change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(RadioGroup, { props: { items, label: "Size", onValueChange } });

    await user.click(screen.getByRole("radio", { name: "Large" }));
    expect(screen.getByRole("radio", { name: "Large" })).toHaveAttribute("data-state", "checked");
    expect(onValueChange).toHaveBeenCalledWith("large");
  });

  it("falls back to the value when no label is given", () => {
    render(RadioGroup, { props: { items: [{ value: "x" }], label: "Letters" } });
    expect(screen.getByRole("radio", { name: "x" })).toBeInTheDocument();
  });

  it("supports a horizontal orientation", () => {
    render(RadioGroup, { props: { items, label: "Size", orientation: "horizontal" } });
    const group = screen.getByRole("radiogroup", { name: "Size" });
    expect(group).toHaveAttribute("aria-orientation", "horizontal");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(RadioGroup, {
      props: { items, label: "Size", value: "small" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
