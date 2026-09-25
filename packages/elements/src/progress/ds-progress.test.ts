import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import type { DsProgress } from "./ds-progress";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const fill = (bar: HTMLElement) => bar.querySelector<HTMLElement>(".progress__indicator")!;

describe("<ds-progress>", () => {
  it("renders a labelled determinate bar and sizes the fill", () => {
    document.body.innerHTML = `<ds-progress value="25" label="Loading"></ds-progress>`;
    const bar = screen.getByRole("progressbar", { name: "Loading" });
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("data-state", "loading");
    expect(fill(bar).style.inlineSize).toBe("25%");
  });

  it("is determinate by design: zero renders an empty fill", () => {
    document.body.innerHTML = `<ds-progress label="Achievements"></ds-progress>`;
    const bar = screen.getByRole("progressbar", { name: "Achievements" });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(fill(bar).style.inlineSize).toBe("0%");
  });

  it("maps a custom range and marks completion at the maximum", () => {
    document.body.innerHTML = `<ds-progress value="5" max="10" label="Steps"></ds-progress>`;
    const element = document.querySelector("ds-progress") as DsProgress;
    const bar = screen.getByRole("progressbar", { name: "Steps" });
    expect(fill(bar).style.inlineSize).toBe("50%");
    element.value = 10;
    expect(bar).toHaveAttribute("data-state", "complete");
    expect(fill(bar).style.inlineSize).toBe("100%");
  });

  it("updates the same fill so the width transition can run", () => {
    document.body.innerHTML = `<ds-progress value="10" label="Loading"></ds-progress>`;
    const before = document.querySelector(".progress__indicator");
    document.querySelector("ds-progress")!.setAttribute("value", "60");
    expect(document.querySelector(".progress__indicator")).toBe(before);
  });

  it("renders a determinate circle whose ring maps the percentage", () => {
    document.body.innerHTML = `<ds-progress value="40" label="Exporting" shape="circle" show-value></ds-progress>`;
    const bar = screen.getByRole("progressbar", { name: "Exporting" });
    expect(bar).toHaveClass("progress--circle");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    const ring = bar.querySelector<SVGElement>(".progress__ring")!;
    expect(ring.style.strokeDasharray).toBe("40 100");
    expect(bar.querySelector(".progress__value")).toHaveTextContent("40%");
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = `<ds-progress value="70" label="Loading"></ds-progress>`;
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});
