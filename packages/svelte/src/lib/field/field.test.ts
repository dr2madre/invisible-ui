import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./field.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Field", () => {
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
