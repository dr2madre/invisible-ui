import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Field, type FieldProps } from "./Field";
import { useField } from "./use-field";

const Email = (props: Omit<FieldProps, "label" | "children">) => (
  <Field label="Email" {...props}>
    {({ controlProps }) => <input type="email" {...controlProps} />}
  </Field>
);

function HeadlessField() {
  const api = useField({ id: "phone", hasDescription: true });
  return (
    <div {...api.rootProps}>
      <label {...api.labelProps}>Phone</label>
      <input type="tel" {...api.controlProps} />
      <p {...api.descriptionProps}>With the country code.</p>
    </div>
  );
}

describe("React Field", () => {
  it("labels the control and links its description", () => {
    render(<Email description="We never share it." />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAccessibleDescription("We never share it.");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(document.querySelector(".form-field")).not.toHaveAttribute("data-invalid");
  });

  it("marks the control invalid and describes it by the error too", () => {
    render(<Email description="We never share it." error="Enter a valid address." />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("We never share it. Enter a valid address.");
    expect(screen.getByText("Enter a valid address.")).toHaveAttribute("aria-live", "polite");
    expect(document.querySelector(".form-field")).toHaveAttribute("data-invalid");
  });

  it("omits the description link when there is no description", () => {
    render(<Email />);
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-describedby");
  });

  it("marks the control required, with a hidden marker", () => {
    render(<Email required />);
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-required", "true");
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("disables the control and the field", () => {
    render(<Email disabled />);
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(document.querySelector(".form-field")).toHaveClass("form-field--disabled");
  });

  it("derives the part ids from the given id and hands the control id over", () => {
    render(
      <Field label="Name" id="signup-name">
        {({ controlProps, controlId }) => (
          <input {...controlProps} data-testid="name" data-control={controlId} />
        )}
      </Field>,
    );
    const input = screen.getByTestId("name");
    expect(input).toHaveAttribute("id", "signup-name-control");
    expect(input).toHaveAttribute("data-control", "signup-name-control");
  });

  it("has no accessibility violations when valid", async () => {
    const { container } = render(<Email description="We never share it." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when invalid", async () => {
    const { container } = render(<Email required error="Enter a valid address." />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("useField (headless)", () => {
  it("wires markup of your own", async () => {
    const { container } = render(<HeadlessField />);
    const input = screen.getByLabelText("Phone");
    expect(input).toHaveAttribute("id", "phone-control");
    expect(input).toHaveAccessibleDescription("With the country code.");
    expect(await axe(container)).toHaveNoViolations();
  });
});
