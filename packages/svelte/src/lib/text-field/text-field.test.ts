import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./text-field.fixture.svelte";

describe("Svelte text field (headless adapter)", () => {
  it("associates the label with the control via for/id", () => {
    render(Fixture);
    // getByLabelText resolves the label[for] -> control[id] association.
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("links a description through aria-describedby", () => {
    render(Fixture, { props: { description: "Your legal name" } });
    const control = screen.getByLabelText("Name");
    const description = screen.getByText("Your legal name");
    expect(control.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("marks the invalid state and announces the error", () => {
    render(Fixture, { props: { invalid: true } });
    const control = screen.getByLabelText("Name");
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAttribute("data-invalid", "");

    const error = screen.getByRole("alert");
    expect(control.getAttribute("aria-describedby")).toContain(error.id);
  });

  it("reports typed values, and stays silent when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(Fixture, { props: { onValueChange } });

    await user.type(screen.getByLabelText("Name"), "Jane");
    expect(onValueChange).toHaveBeenLastCalledWith("Jane");

    onValueChange.mockClear();
    await rerender({ disabled: true, onValueChange });
    const control = screen.getByLabelText("Name");
    expect(control).toBeDisabled();
    await user.type(control, "x");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, {
      props: { description: "Your legal name", invalid: true },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
