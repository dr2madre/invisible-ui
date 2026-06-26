import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Progress from "./Progress.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Progress (styled)", () => {
  it("renders a labelled determinate bar and sizes the fill", () => {
    const { container } = render(Progress, { props: { value: 25, label: "Loading" } });
    const bar = screen.getByRole("progressbar", { name: "Loading" });
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    const fill = container.querySelector(".progress__indicator")!;
    expect(fill.getAttribute("style")).toContain("inline-size: 25%");
  });

  it("renders an indeterminate bar without a value", () => {
    render(Progress, { props: { value: null, label: "Working" } });
    const bar = screen.getByRole("progressbar", { name: "Working" });
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar).toHaveAttribute("data-state", "indeterminate");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Progress, { props: { value: 70, label: "Loading" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
