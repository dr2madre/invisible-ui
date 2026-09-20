import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { TextField } from "./TextField";

describe("React TextField", () => {
  it("renders a labelled native input", () => {
    render(<TextField label="Full name" />);
    expect(screen.getByRole("textbox", { name: "Full name" })).toHaveAttribute("type", "text");
  });

  it("visually hides its label without removing the accessible name", () => {
    const { rerender } = render(<TextField label="Full name" hideLabel />);
    const input = screen.getByRole("textbox", { name: "Full name" });
    const label = document.querySelector(".field__label");

    expect(input).toHaveAccessibleName("Full name");
    expect(label).toHaveClass("field__label--hidden");

    rerender(<TextField label="Full name" />);
    expect(label).not.toHaveClass("field__label--hidden");
    expect(input).toHaveAccessibleName("Full name");
  });

  it("reports a user edit exactly once and renders it locally", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TextField label="Full name" onValueChange={onValueChange} />);

    const input = screen.getByRole("textbox", { name: "Full name" });
    await user.type(input, "A");

    expect(input).toHaveValue("A");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("A");
  });

  it("mirrors a later value prop without reporting it", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <TextField label="Full name" value="Ada" onValueChange={onValueChange} />,
    );

    rerender(<TextField label="Full name" value="Grace" onValueChange={onValueChange} />);

    expect(screen.getByRole("textbox", { name: "Full name" })).toHaveValue("Grace");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("restores its current default on form reset without reporting it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <form data-testid="form">
        <TextField label="Full name" name="fullName" value="Ada" onValueChange={onValueChange} />
      </form>,
    );
    const input = screen.getByRole("textbox", { name: "Full name" });

    await user.clear(input);
    await user.type(input, "Grace");
    const reportsBeforeReset = onValueChange.mock.calls.length;

    await act(async () => {
      (screen.getByTestId("form") as HTMLFormElement).reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(input).toHaveValue("Ada");
    expect(onValueChange).toHaveBeenCalledTimes(reportsBeforeReset);
  });

  it("links description and error while preserving native constraints", () => {
    render(
      <TextField
        label="Email"
        description="We never share it."
        error="Invalid email."
        required
        maxLength={80}
        autoComplete="email"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Email" });

    expect(input).toHaveAccessibleDescription("We never share it. Invalid email.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("maxlength", "80");
    expect(input).toHaveAttribute("autocomplete", "email");
  });

  it("has no accessibility violations with a hidden label", async () => {
    const { container } = render(
      <TextField label="Email" hideLabel description="We never share it." />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
