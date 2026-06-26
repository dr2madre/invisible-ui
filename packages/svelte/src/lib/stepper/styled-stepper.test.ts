import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./stepper.fixture.svelte";

describe("Svelte Stepper (styled)", () => {
  it("is a labelled progress nav of step buttons", () => {
    render(Fixture);
    expect(screen.getByRole("navigation", { name: "Checkout progress" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Account/ })).toBeInTheDocument();
  });

  it("marks the current step with aria-current", () => {
    render(Fixture, { props: { current: 1 } });
    expect(screen.getByRole("button", { name: /Shipping/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByRole("button", { name: /Account/ })).not.toHaveAttribute("aria-current");
  });

  it("reflects each step's status", () => {
    render(Fixture, { props: { current: 1 } });
    const steps = document.querySelectorAll(".stepper__step");
    expect(steps[0]).toHaveAttribute("data-status", "complete");
    expect(steps[1]).toHaveAttribute("data-status", "current");
    expect(steps[2]).toHaveAttribute("data-status", "upcoming");
  });

  it("linear: upcoming steps are disabled, completed ones are not", () => {
    render(Fixture, { props: { current: 1, linear: true } });
    expect(screen.getByRole("button", { name: /Review/ })).toBeDisabled(); // upcoming
    expect(screen.getByRole("button", { name: /Account/ })).toBeEnabled(); // completed
  });

  it("navigates to a completed step on click", async () => {
    render(Fixture, { props: { current: 2 } });
    await fireEvent.click(screen.getByRole("button", { name: /Account/ }));
    expect(screen.getByRole("button", { name: /Account/ })).toHaveAttribute("aria-current", "step");
  });

  it("non-linear: any step is clickable", async () => {
    render(Fixture, { props: { current: 0, linear: false } });
    const review = screen.getByRole("button", { name: /Review/ });
    expect(review).toBeEnabled();
    await fireEvent.click(review);
    expect(review).toHaveAttribute("aria-current", "step");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { current: 1 } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
