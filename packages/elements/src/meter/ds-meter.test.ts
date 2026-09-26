import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import type { DsMeter } from "./ds-meter";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const indicator = () => document.querySelector<HTMLElement>(".meter__indicator")!;
const host = () => document.querySelector("ds-meter") as DsMeter;

describe("<ds-meter>", () => {
  it("renders a labelled meter and sizes the fill", () => {
    document.body.innerHTML = `<ds-meter value="75" label="Storage"></ds-meter>`;
    const meter = screen.getByRole("meter", { name: "Storage" });
    expect(meter).toHaveClass("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "75");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(indicator().style.inlineSize).toBe("75%");
  });

  it("clamps the value into the range and maps a custom range", () => {
    document.body.innerHTML = `<ds-meter value="30" min="10" max="20" label="Load"></ds-meter>`;
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "20");
    expect(indicator().style.inlineSize).toBe("100%");
  });

  it("reflects the level on the fill for color coding", () => {
    document.body.innerHTML = `<ds-meter value="95" low="20" high="80" label="Storage"></ds-meter>`;
    expect(indicator()).toHaveAttribute("data-level", "high");
  });

  it("colours by how good the value is, not by which band it sits in", () => {
    // Battery: full is good, so a high value is the good case.
    document.body.innerHTML = `<ds-meter label="Battery" value="90" low="20" high="60"></ds-meter>`;
    expect(indicator()).toHaveAttribute("data-quality", "optimal");

    // Disk usage: empty is good, so the same high value is the bad case.
    document.body.innerHTML = `<ds-meter label="Disk" value="90" low="50" high="80" optimum="0"></ds-meter>`;
    expect(indicator()).toHaveAttribute("data-quality", "poor");
    expect(indicator()).toHaveAttribute("data-level", "high");
  });

  it("reflects a value change after mount everywhere, in the same fill", () => {
    document.body.innerHTML = `<ds-meter label="Battery" value="90" low="20" high="60"></ds-meter>`;
    const before = indicator();
    host().value = 10;
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "10");
    expect(indicator()).toBe(before);
    expect(indicator()).toHaveAttribute("data-quality", "poor");
    expect(indicator().style.inlineSize).toBe("10%");
  });

  it("clears an optional threshold set to undefined", () => {
    document.body.innerHTML = `<ds-meter label="Disk" value="90" high="80"></ds-meter>`;
    expect(indicator()).toHaveAttribute("data-level", "high");
    host().high = undefined;
    expect(host()).not.toHaveAttribute("high");
    expect(indicator()).toHaveAttribute("data-level", "medium");
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = `<ds-meter value="50" label="Storage"></ds-meter>`;
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});
