import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsLocaleProvider } from "../locale-provider/ds-locale-provider";
import type { DsStepper, StepDescriptor } from "./ds-stepper";

const STEPS: StepDescriptor[] = [
  { label: "Account", description: "Your details" },
  { label: "Shipping", description: "Where to send it" },
  { label: "Payment", description: "How you'll pay" },
  { label: "Review", description: "Confirm and submit" },
];

const mount = (attributes = 'current="1"') => {
  document.body.innerHTML = `<ds-stepper label="Checkout progress" ${attributes}></ds-stepper>`;
  const host = document.querySelector("ds-stepper") as DsStepper;
  host.steps = STEPS;
  return host;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-stepper>", () => {
  it("is a labelled progress nav around an ordered list of step buttons", () => {
    mount();
    const nav = screen.getByRole("navigation", { name: "Checkout progress" });
    expect(nav).toHaveClass("stepper");
    expect(nav.querySelector("ol.stepper__list")).toHaveAttribute("data-orientation", "horizontal");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("button", { name: /Account/ })).toBeInTheDocument();
  });

  it("marks the current step with aria-current", () => {
    mount();
    expect(screen.getByRole("button", { name: /Shipping/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByRole("button", { name: /Account/ })).not.toHaveAttribute("aria-current");
  });

  it("reflects each step's status and draws a connector before every step but the first", () => {
    mount();
    const steps = document.querySelectorAll(".stepper__step");
    expect(steps[0]).toHaveAttribute("data-status", "complete");
    expect(steps[1]).toHaveAttribute("data-status", "current");
    expect(steps[2]).toHaveAttribute("data-status", "upcoming");
    expect(steps[0]!.querySelector(".stepper__connector")).toBeNull();
    expect(steps[1]!.querySelector(".stepper__connector")).toHaveAttribute("aria-hidden", "true");
    expect(steps[0]!.querySelector(".stepper__indicator svg")).not.toBeNull();
    expect(steps[2]!.querySelector(".stepper__indicator")).toHaveTextContent("3");
  });

  it("linear: upcoming steps are disabled, completed ones are not", () => {
    mount();
    expect(screen.getByRole("button", { name: /Review/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Account/ })).toBeEnabled();
  });

  it("navigates to a completed step on click and reports it", async () => {
    const host = mount('current="2"');
    const change = vi.fn();
    host.addEventListener("change", (event) => change((event as CustomEvent).detail));
    const account = screen.getByRole("button", { name: /Account/ });
    await userEvent.click(account);
    expect(account).toHaveAttribute("aria-current", "step");
    expect(account).toHaveFocus();
    expect(host.current).toBe(0);
    expect(host).toHaveAttribute("current", "0");
    expect(change).toHaveBeenCalledWith({ current: 0 });
  });

  it("non-linear: any step is clickable", async () => {
    mount('current="0" linear="false"');
    const review = screen.getByRole("button", { name: /Review/ });
    expect(review).toBeEnabled();
    await userEvent.click(review);
    expect(review).toHaveAttribute("aria-current", "step");
  });

  it("reflects the current step set from outside without reporting it", () => {
    const host = mount();
    const change = vi.fn();
    host.addEventListener("change", change);
    host.current = 3;
    expect(screen.getByRole("button", { name: /Review/ })).toHaveAttribute("aria-current", "step");
    host.current = 99;
    expect(host.current).toBe(3);
    expect(change).not.toHaveBeenCalled();
  });

  it("disables every step when disabled", () => {
    mount('current="2" disabled');
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  });

  it("lays out vertically when asked", () => {
    mount('orientation="vertical"');
    expect(document.querySelector(".stepper__list")).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  // The checkmark is aria-hidden, so the status word has to reach the
  // accessibility tree: the name is asserted, not the text content.
  it("puts the completed state in the accessible name, after the label", () => {
    mount('current="2" linear="false"');
    expect(screen.getByRole("button", { name: /Account/ })).toHaveAccessibleName(
      "Account Completed Your details",
    );
    expect(screen.getByRole("button", { name: /Payment/ })).not.toHaveAccessibleName(/Completed/i);
    expect(screen.getByRole("button", { name: /Review/ })).not.toHaveAccessibleName(/Completed/i);
  });

  it("localizes the landmark and the status, the attributes winning", () => {
    document.body.innerHTML = `
      <ds-locale-provider locale="it"><ds-stepper current="1"></ds-stepper></ds-locale-provider>`;
    const host = document.querySelector("ds-stepper") as DsStepper;
    host.steps = [{ label: "Account" }, { label: "Pagamento" }];
    const provider = document.querySelector("ds-locale-provider") as DsLocaleProvider;
    provider.messages = { "stepper.label": "Avanzamento", "stepper.completed": "Completato" };
    expect(screen.getByRole("navigation", { name: "Avanzamento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Account/ })).toHaveAccessibleName(
      "Account Completato",
    );
    host.setAttribute("completed-label", "Fatto");
    expect(screen.getByRole("button", { name: /Account/ })).toHaveAccessibleName("Account Fatto");
  });

  it("treats labels and descriptions as text", () => {
    const host = mount();
    host.steps = [{ label: "<img src=x>", description: "<b>bold</b>" }];
    expect(document.querySelector(".stepper img, .stepper b")).toBeNull();
    expect(screen.getByRole("button")).toHaveAccessibleName("<img src=x> <b>bold</b>");
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
