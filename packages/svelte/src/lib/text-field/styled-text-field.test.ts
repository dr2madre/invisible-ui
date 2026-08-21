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

  it("links the success message so a screen reader reaches it", () => {
    render(TextField, { props: { label: "Email", success: "Looks good." } });
    const input = screen.getByLabelText("Email");
    const message = screen.getByText("Looks good.");

    expect(input.getAttribute("aria-describedby") ?? "").toContain(message.id);
    expect(message).toHaveAttribute("aria-live", "polite");
  });

  it("describes by the error alone when both error and success are given", () => {
    render(TextField, {
      props: { label: "Email", error: "Invalid email.", success: "Looks good." },
    });
    const describedby = screen.getByLabelText("Email").getAttribute("aria-describedby") ?? "";

    expect(describedby).toBe(screen.getByRole("alert").id);
    expect(screen.queryByText("Looks good.")).toBeNull();
  });

  it("forwards the native constraints and hints to the input", () => {
    render(TextField, {
      props: {
        label: "Postcode",
        maxlength: 8,
        minlength: 5,
        pattern: "[A-Z0-9 ]+",
        inputmode: "text",
        autocomplete: "postal-code",
        spellcheck: false,
      },
    });
    const input = screen.getByLabelText("Postcode");
    // These are the browser's own constraints: it enforces and reports them,
    // so they have to reach the real control.
    expect(input).toHaveAttribute("maxlength", "8");
    expect(input).toHaveAttribute("minlength", "5");
    expect(input).toHaveAttribute("pattern", "[A-Z0-9 ]+");
    expect(input).toHaveAttribute("inputmode", "text");
    expect(input).toHaveAttribute("autocomplete", "postal-code");
    expect(input).toHaveAttribute("spellcheck", "false");
  });

  it("leaves the constraints off when they are not asked for", () => {
    render(TextField, { props: { label: "Full name" } });
    const input = screen.getByLabelText("Full name");
    for (const attribute of ["maxlength", "minlength", "pattern", "inputmode"]) {
      expect(input).not.toHaveAttribute(attribute);
    }
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
