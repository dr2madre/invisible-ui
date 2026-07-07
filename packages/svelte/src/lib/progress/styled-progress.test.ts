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

  it("is determinate by design: zero renders an empty fill, never a sweep", () => {
    const { container } = render(Progress, { props: { value: 0, label: "Achievements" } });
    const bar = screen.getByRole("progressbar", { name: "Achievements" });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    const fill = container.querySelector(".progress__indicator")!;
    expect(fill.getAttribute("style")).toContain("inline-size: 0%");
  });

  it("renders a determinate circle whose ring maps the percentage", () => {
    const { container } = render(Progress, {
      props: { value: 40, label: "Exporting", shape: "circle", showValue: true },
    });
    const bar = screen.getByRole("progressbar", { name: "Exporting" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    const ring = container.querySelector(".progress__ring")!;
    expect(ring.getAttribute("style")).toContain("stroke-dasharray: 40 100");
    expect(container.querySelector(".progress__value")).toHaveTextContent("40%");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Progress, { props: { value: 70, label: "Loading" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
