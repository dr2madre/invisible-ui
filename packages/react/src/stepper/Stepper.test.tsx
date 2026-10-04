import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Stepper, type StepDescriptor } from "./Stepper";

const steps: StepDescriptor[] = [
  { label: "Account", description: "Your details" },
  { label: "Shipping", description: "Where to send it" },
  { label: "Payment", description: "How you'll pay" },
  { label: "Review", description: "Confirm and submit" },
];

const step = (name: RegExp) => screen.getByRole("button", { name });

describe("React Stepper (styled)", () => {
  it("is a labelled progress nav around an ordered list of step buttons", () => {
    render(<Stepper steps={steps} label="Checkout progress" />);
    const nav = screen.getByRole("navigation", { name: "Checkout progress" });
    expect(nav.querySelector("ol.stepper__list")).not.toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("names the landmark from the catalog", () => {
    render(<Stepper steps={steps} />);
    expect(screen.getByRole("navigation", { name: "Progress" })).toBeInTheDocument();
  });

  it("marks the current step and reflects each step's status", () => {
    render(<Stepper steps={steps} current={1} />);
    expect(step(/Shipping/)).toHaveAttribute("aria-current", "step");
    expect(step(/Account/)).not.toHaveAttribute("aria-current");
    const items = document.querySelectorAll(".stepper__step");
    expect(items[0]).toHaveAttribute("data-status", "complete");
    expect(items[1]).toHaveAttribute("data-status", "current");
    expect(items[2]).toHaveAttribute("data-status", "upcoming");
    // A connector before every step but the first.
    expect(document.querySelectorAll(".stepper__connector")).toHaveLength(3);
  });

  it("linear: upcoming steps are disabled, completed ones are not", () => {
    render(<Stepper steps={steps} current={1} />);
    expect(step(/Review/)).toBeDisabled();
    expect(step(/Account/)).toBeEnabled();
  });

  it("navigates to a completed step on click and reports it once", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(<Stepper steps={steps} current={2} onStepChange={onStepChange} />);
    await user.click(step(/Account/));
    expect(step(/Account/)).toHaveAttribute("aria-current", "step");
    expect(onStepChange).toHaveBeenCalledTimes(1);
    expect(onStepChange).toHaveBeenCalledWith(0);
  });

  it("non-linear: any step is clickable", async () => {
    const user = userEvent.setup();
    render(<Stepper steps={steps} linear={false} />);
    await user.click(step(/Review/));
    expect(step(/Review/)).toHaveAttribute("aria-current", "step");
  });

  it("reflects the current step set from outside without reporting it", () => {
    const onStepChange = vi.fn();
    const { rerender } = render(<Stepper steps={steps} current={0} onStepChange={onStepChange} />);
    rerender(<Stepper steps={steps} current={2} onStepChange={onStepChange} />);
    expect(step(/Payment/)).toHaveAttribute("aria-current", "step");
    expect(document.querySelectorAll('.stepper__step[data-status="complete"]')).toHaveLength(2);
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("disables every step when disabled, and lays out vertically when asked", () => {
    render(<Stepper steps={steps} current={2} disabled orientation="vertical" />);
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    expect(document.querySelector(".stepper__list")).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it("puts the completed state in the accessible name, after the label", () => {
    render(<Stepper steps={steps} current={2} linear={false} />);
    expect(step(/Account/)).toHaveAccessibleName("Account Completed Your details");
    expect(step(/Payment/)).not.toHaveAccessibleName(/Completed/i);
    expect(step(/Review/)).not.toHaveAccessibleName(/Completed/i);
  });

  it("says the status in the provider's language", () => {
    render(
      <LocaleProvider locale="it" messages={{ "stepper.completed": "Completato" }}>
        <Stepper steps={steps} current={1} />
      </LocaleProvider>,
    );
    expect(step(/Account/)).toHaveAccessibleName(/Account Completato/);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Stepper steps={steps} current={1} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
