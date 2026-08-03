import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { RadioGroup } from "./RadioGroup";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

// Built on native <input type="radio">: single selection, roving tabindex and
// arrow-key navigation are the browser's job, covered by E2E in a real browser
// (jsdom doesn't implement radio keyboard nav). These tests cover the wiring
// we own: rendering, selection, disabled and accessibility.
describe("Vue RadioGroup (styled)", () => {
  it("renders a named group with the selected item checked", () => {
    render(RadioGroup, { props: { items, label: "Size", value: "medium" } });
    expect(screen.getByRole("radiogroup", { name: "Size" })).toBeInTheDocument();

    const medium = screen.getByRole("radio", { name: "Medium" });
    expect(medium).toHaveAttribute("data-state", "checked");
    expect(medium).toBeChecked();
  });

  it("radios share a single group name", () => {
    render(RadioGroup, { props: { items, label: "Size" } });
    const radios = screen.getAllByRole<HTMLInputElement>("radio");
    const names = new Set(radios.map((r) => r.name));
    expect(names.size).toBe(1);
  });

  it("selects on click and reports the change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(RadioGroup, { props: { items, label: "Size", onValueChange } });

    await user.click(screen.getByRole("radio", { name: "Large" }));
    expect(screen.getByRole("radio", { name: "Large" })).toHaveAttribute("data-state", "checked");
    expect(onValueChange).toHaveBeenCalledWith("large");
  });

  it("supports v-model: emits update:modelValue on selection", async () => {
    const user = userEvent.setup();
    const { emitted } = render(RadioGroup, { props: { items, label: "Size", modelValue: null } });

    await user.click(screen.getByRole("radio", { name: "Medium" }));
    expect(emitted("update:modelValue")).toEqual([["medium"]]);
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

  it("mirrors an externally controlled value", async () => {
    const { rerender } = render(RadioGroup, { props: { items, label: "Size", value: "small" } });
    expect(screen.getByRole("radio", { name: "Small" })).toBeChecked();
    await rerender({ value: "large" });
    expect(screen.getByRole("radio", { name: "Large" })).toBeChecked();
  });

  it("is inert when the group is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(RadioGroup, { props: { items, label: "Size", disabled: true, onValueChange } });

    const radio = screen.getByRole("radio", { name: "Small" });
    expect(radio).toBeDisabled();
    await user.click(radio);
    expect(radio).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("submits the selected value under the group name", async () => {
    const user = userEvent.setup();
    const Fixture = defineComponent({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(RadioGroup, {
            label: "Plan",
            name: "plan",
            value: "free",
            items: [
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
            ],
          }),
        ]),
    });
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;

    expect(new FormData(form).get("plan")).toBe("free");

    await user.click(screen.getByRole("radio", { name: "Pro" }));
    expect(new FormData(form).get("plan")).toBe("pro");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(RadioGroup, {
      props: { items, label: "Size", value: "small" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
