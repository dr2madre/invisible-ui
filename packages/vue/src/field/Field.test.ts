import { render, screen } from "@testing-library/vue";
import { defineComponent, h, type PropType } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Field } from "./Field";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

// The control arrives through the scoped default slot, exactly how a consumer
// wires it: spread `controlProps` onto the control.
const Fixture = defineComponent({
  props: {
    description: { type: String, default: "We'll never share it." },
    error: { type: String as PropType<string | undefined>, default: undefined },
    required: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h(
        Field,
        {
          label: "Email",
          description: props.description,
          error: props.error,
          required: props.required,
        },
        {
          default: ({ controlProps }: { controlProps: Record<string, unknown> }) => [
            h("input", { type: "email", ...controlProps }),
          ],
        },
      );
  },
});

describe("Vue Field", () => {
  it("labels the control and links its description", () => {
    render(Fixture);
    const input = screen.getByLabelText("Email");
    const description = screen.getByText("We'll never share it.");
    expect(input).toHaveAttribute("aria-describedby", description.id);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marks the control invalid and describes it by the error too", () => {
    render(Fixture, { props: { error: "Enter a valid email" } });
    const input = screen.getByLabelText("Email");
    const error = screen.getByText("Enter a valid email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
  });

  it("omits the description link when there is no description", () => {
    render(Fixture, { props: { description: "" } });
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-describedby");
  });

  it("marks the control required", () => {
    render(Fixture, { props: { required: true } });
    // Query by role: the asterisk marker can leak into the computed name.
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-required", "true");
  });

  it("has no accessibility violations when valid", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });

  it("has no accessibility violations when invalid", async () => {
    const { container } = render(Fixture, { props: { error: "Enter a valid email" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
