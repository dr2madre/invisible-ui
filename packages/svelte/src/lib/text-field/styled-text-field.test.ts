import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import TextField from "./TextField.svelte";

describe("Svelte TextField (styled)", () => {
  it("renders a labelled text input", () => {
    render(TextField, { props: { label: "Full name" } });
    const input = screen.getByLabelText("Full name");
    expect(input).toHaveAttribute("type", "text");
  });

  it("reports typed values", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(TextField, { props: { label: "Full name", onValueChange } });

    await user.type(screen.getByLabelText("Full name"), "Jane");
    expect(onValueChange).toHaveBeenLastCalledWith("Jane");
  });

  it("links the description and reflects the error/invalid state", () => {
    render(TextField, {
      props: {
        label: "Email",
        type: "email",
        description: "We never share it.",
        error: "Invalid email.",
      },
    });
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");

    const describedby = input.getAttribute("aria-describedby") ?? "";
    expect(describedby).toContain(screen.getByText("We never share it.").id);
    expect(describedby).toContain(screen.getByRole("alert").id);
  });

  it("marks required with aria-required", () => {
    render(TextField, { props: { label: "Username", required: true } });
    expect(screen.getByLabelText(/Username/)).toHaveAttribute("aria-required", "true");
  });

  it("disables the control", () => {
    render(TextField, { props: { label: "Full name", disabled: true } });
    expect(screen.getByLabelText("Full name")).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(TextField, {
      props: { label: "Email", type: "email", description: "We never share it." },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
