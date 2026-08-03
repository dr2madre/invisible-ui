import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Stepper, type StepDescriptor } from "./Stepper";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const steps: StepDescriptor[] = [
  { label: "Account", description: "Your details" },
  { label: "Shipping", description: "Where to send it" },
  { label: "Payment", description: "How you'll pay" },
  { label: "Review", description: "Confirm and submit" },
];

const setup = (props: Record<string, unknown> = {}) =>
  render(Stepper, { props: { steps, label: "Checkout progress", ...props } });

describe("Vue Stepper", () => {
  it("is a labelled progress nav of step buttons", () => {
    setup();
    expect(screen.getByRole("navigation", { name: "Checkout progress" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Account/ })).toBeInTheDocument();
  });

  it("marks the current step with aria-current", () => {
    setup({ current: 1 });
    expect(screen.getByRole("button", { name: /Shipping/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByRole("button", { name: /Account/ })).not.toHaveAttribute("aria-current");
  });

  it("reflects each step's status", () => {
    setup({ current: 1 });
    const rendered = document.querySelectorAll(".stepper__step");
    expect(rendered[0]).toHaveAttribute("data-status", "complete");
    expect(rendered[1]).toHaveAttribute("data-status", "current");
    expect(rendered[2]).toHaveAttribute("data-status", "upcoming");
  });

  it("linear: upcoming steps are disabled, completed ones are not", () => {
    setup({ current: 1, linear: true });
    expect(screen.getByRole("button", { name: /Review/ })).toBeDisabled(); // upcoming
    expect(screen.getByRole("button", { name: /Account/ })).toBeEnabled(); // completed
  });

  it("navigates to a completed step on click", async () => {
    const user = userEvent.setup();
    setup({ current: 2 });
    await user.click(screen.getByRole("button", { name: /Account/ }));
    expect(screen.getByRole("button", { name: /Account/ })).toHaveAttribute("aria-current", "step");
  });

  it("non-linear: any step is clickable", async () => {
    const user = userEvent.setup();
    setup({ current: 0, linear: false });
    const review = screen.getByRole("button", { name: /Review/ });
    expect(review).toBeEnabled();
    await user.click(review);
    expect(review).toHaveAttribute("aria-current", "step");
  });

  it("reports the new step through v-model and onStepChange", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    const { emitted } = setup({ current: 2, onStepChange });
    await user.click(screen.getByRole("button", { name: /Shipping/ }));
    expect(onStepChange).toHaveBeenCalledWith(1);
    expect(emitted()["update:current"]).toEqual([[1]]);
  });

  it("lays out vertically when asked", () => {
    setup({ orientation: "vertical" });
    expect(document.querySelector(".stepper__list")).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({ current: 1 });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
