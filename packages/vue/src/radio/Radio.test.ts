import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Radio } from "./Radio";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const Pair = defineComponent({
  props: {
    value: { type: String, default: "free" },
    onChange: { type: Function, default: undefined },
  },
  setup(props) {
    return () => [
      h(
        Radio,
        {
          name: "plan",
          value: "free",
          checked: props.value === "free",
          onChange: props.onChange as ((value: string) => void) | undefined,
        },
        () => "Free",
      ),
      h(
        Radio,
        {
          name: "plan",
          value: "pro",
          checked: props.value === "pro",
          onChange: props.onChange as ((value: string) => void) | undefined,
        },
        () => "Pro",
      ),
    ];
  },
});

describe("Vue Radio", () => {
  it("renders labelled radios that share a group name", () => {
    render(Pair, { props: { value: "free" } });
    const free = screen.getByRole("radio", { name: "Free" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    expect(free).toBeChecked();
    expect(pro).not.toBeChecked();
    expect(free).toHaveAttribute("name", "plan");
    expect(pro).toHaveAttribute("name", "plan");
  });

  it("reports the value when a radio is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(Pair, { props: { value: "free", onChange } });
    await user.click(screen.getByRole("radio", { name: "Pro" }));
    expect(onChange).toHaveBeenCalledWith("pro");
  });

  it("is selectable by clicking its label", async () => {
    const user = userEvent.setup();
    render(Pair, { props: { value: "free" } });
    await user.click(screen.getByText("Pro"));
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("falls back to the label prop when no slot is given", () => {
    render(Radio, { props: { name: "plan", value: "free", label: "Free" } });
    expect(screen.getByRole("radio", { name: "Free" })).toBeInTheDocument();
  });

  it("is inert when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(Radio, {
      props: { name: "plan", value: "free", label: "Free", disabled: true, onChange },
    });
    const radio = screen.getByRole("radio", { name: "Free" });
    expect(radio).toBeDisabled();
    await user.click(radio);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Pair, { props: { value: "free" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
