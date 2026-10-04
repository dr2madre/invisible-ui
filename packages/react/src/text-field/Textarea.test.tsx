import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Textarea } from "./Textarea";

describe("React Textarea", () => {
  it("renders a labelled multi-line control", () => {
    render(<Textarea label="Message" rows={5} />);
    const control = screen.getByRole("textbox", { name: "Message" });
    expect(control.tagName).toBe("TEXTAREA");
    expect(control).toHaveAttribute("rows", "5");
    expect(control.closest(".textarea")).not.toBeNull();
  });

  it("shows three rows by default", () => {
    render(<Textarea label="Message" />);
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute("rows", "3");
  });

  it("visually hides its label without removing the accessible name", () => {
    const { rerender } = render(<Textarea label="Message" hideLabel />);
    const control = screen.getByRole("textbox", { name: "Message" });
    const label = document.querySelector(".field__label");

    expect(label).toHaveClass("field__label--hidden");
    rerender(<Textarea label="Message" />);
    expect(label).not.toHaveClass("field__label--hidden");
    expect(control).toHaveAccessibleName("Message");
  });

  it("reports each user edit exactly once and renders it locally", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Textarea label="Message" onValueChange={onValueChange} />);
    const control = screen.getByRole("textbox", { name: "Message" });

    await user.type(control, "Hi");

    expect(control).toHaveValue("Hi");
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenNthCalledWith(1, "H");
    expect(onValueChange).toHaveBeenLastCalledWith("Hi");
  });

  it("mirrors a later value prop without reporting it", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Textarea label="Message" value="Hello" onValueChange={onValueChange} />,
    );

    rerender(<Textarea label="Message" value="Goodbye" onValueChange={onValueChange} />);

    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Goodbye");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("restores its current default on form reset without reporting it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <form data-testid="form">
        <Textarea label="Message" name="message" value="Hello" onValueChange={onValueChange} />
      </form>,
    );
    // The default the reset lands on is the current prop, not the first one.
    rerender(
      <form data-testid="form">
        <Textarea label="Message" name="message" value="Hi there" onValueChange={onValueChange} />
      </form>,
    );
    const control = screen.getByRole("textbox", { name: "Message" });

    await user.clear(control);
    await user.type(control, "Edited");
    const reportsBeforeReset = onValueChange.mock.calls.length;

    await act(async () => {
      (screen.getByTestId("form") as HTMLFormElement).reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(control).toHaveValue("Hi there");
    expect(onValueChange).toHaveBeenCalledTimes(reportsBeforeReset);
  });

  it("keeps the edit when the reset is cancelled", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Textarea label="Message" name="message" value="Hello" />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    const control = screen.getByRole("textbox", { name: "Message" });
    await user.type(control, "!");
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });

    await act(async () => {
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(control).toHaveValue("Hello!");
  });

  it("keeps the DOM default after an edit, so the browser's own reset lands on it", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Textarea label="Message" name="message" value="Hello" />
      </form>,
    );
    const control = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Message" });
    await user.type(control, " world");
    await act(() => Promise.resolve());
    expect(control.value).toBe("Hello world");
    expect(control.defaultValue, "the DOM default must not follow the edit").toBe("Hello");
  });

  it("submits its value under its name and forwards autocomplete", () => {
    render(
      <form data-testid="form">
        <Textarea label="Message" name="message" value="Hello" autoComplete="off" />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute("autocomplete", "off");
    expect(new FormData(form).get("message")).toBe("Hello");
  });

  it("submits the edited value", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Textarea label="Message" name="message" />
      </form>,
    );
    await user.type(screen.getByRole("textbox", { name: "Message" }), "Typed");
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("message")).toBe(
      "Typed",
    );
  });

  it("forwards the native length limits and spellcheck", () => {
    render(<Textarea label="Message" maxLength={280} minLength={10} spellCheck={false} />);
    const control = screen.getByRole("textbox", { name: "Message" });
    expect(control).toHaveAttribute("maxlength", "280");
    expect(control).toHaveAttribute("minlength", "10");
    expect(control).toHaveAttribute("spellcheck", "false");
  });

  it("forwards required, read-only and disabled", () => {
    const { rerender } = render(<Textarea label="Message" required readOnly />);
    const control = screen.getByRole("textbox", { name: "Message" });
    expect(control).toBeRequired();
    expect(control).toHaveAttribute("readonly");

    rerender(<Textarea label="Message" disabled />);
    expect(control).toBeDisabled();
    expect(control.closest(".textarea")).toHaveClass("textarea--disabled");
  });

  it("reflects the error/invalid state", () => {
    render(<Textarea label="Message" description="Be kind." error="Too short." />);
    const control = screen.getByRole("textbox", { name: "Message" });
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleDescription("Be kind. Too short.");
    const error = screen.getByRole("alert");
    expect(control.getAttribute("aria-describedby")).toContain(error.id);
    expect(error.querySelector(".field__msg-icon svg")).toBeInTheDocument();
    expect(control.closest(".textarea")).toHaveClass("textarea--invalid");
  });

  it("links and announces success feedback", () => {
    render(<Textarea label="Message" success="Looks good." />);
    const success = screen.getByText("Looks good.");
    expect(success).toHaveAttribute("aria-live", "polite");
    const control = screen.getByRole("textbox", { name: "Message" });
    expect(control.getAttribute("aria-describedby")).toContain(success.id);
    expect(success.querySelector(".field__msg-icon svg")).toBeInTheDocument();
    expect(control.closest(".textarea")).toHaveClass("textarea--success");
  });

  it("lets the error win over simultaneous success feedback", () => {
    render(<Textarea label="Message" error="Too short." success="Looks good." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Too short.");
    expect(screen.queryByText("Looks good.")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Textarea label="Bio" description="About you." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations with a hidden label and an error", async () => {
    const { container } = render(<Textarea label="Bio" hideLabel error="Required." required />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
