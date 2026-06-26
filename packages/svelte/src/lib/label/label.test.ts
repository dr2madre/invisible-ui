import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./label.fixture.svelte";

describe("Svelte Label", () => {
  it("associates the label with its control via for/id", () => {
    render(Fixture);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "email");
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
    expect(label).toHaveAttribute("id", "email-label");
  });

  it("focuses the control when the label is clicked", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await user.click(screen.getByText("Email"));
    expect(screen.getByLabelText("Email")).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
