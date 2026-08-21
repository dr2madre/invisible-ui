import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Meter } from "./Meter";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Vue Meter (styled)", () => {
  it("exposes the meter role with ARIA value and a band", () => {
    render(Meter, { props: { value: 30, low: 20, high: 80, label: "Disk usage" } });
    const meter = screen.getByRole("meter", { name: "Disk usage" });
    expect(meter).toHaveAttribute("aria-valuenow", "30");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(meter).toHaveAttribute("data-level", "medium");
  });

  it("flags a low band below the low threshold", () => {
    render(Meter, { props: { value: 10, low: 20, high: 80, label: "Disk usage" } });
    expect(screen.getByRole("meter")).toHaveAttribute("data-level", "low");
  });

  it("flags a high band at or above the high threshold", () => {
    render(Meter, { props: { value: 90, low: 20, high: 80, label: "Disk usage" } });
    expect(screen.getByRole("meter")).toHaveAttribute("data-level", "high");
  });

  it("sizes the fill from the value", () => {
    const { container } = render(Meter, { props: { value: 75, label: "Storage" } });
    const fill = container.querySelector(".meter__indicator")!;
    expect(fill.getAttribute("style")).toContain("inline-size: 75%");
  });

  it("reflects the level on the fill for color coding", () => {
    const { container } = render(Meter, {
      props: { value: 95, low: 20, high: 80, label: "Storage" },
    });
    expect(container.querySelector(".meter__indicator")).toHaveAttribute("data-level", "high");
  });

  it("colours by how good the value is, not by which band it sits in", () => {
    // Battery: full is good, so a high value is the good case.
    const battery = render(Meter, {
      props: { value: 90, low: 20, high: 60, label: "Battery" },
    });
    expect(battery.container.querySelector(".meter__indicator")).toHaveAttribute(
      "data-quality",
      "optimal",
    );
    battery.unmount();

    // Disk usage: empty is good, so the same high value is the bad case.
    const { container } = render(Meter, {
      props: { value: 90, low: 50, high: 80, optimum: 0, label: "Disk" },
    });
    const indicator = container.querySelector(".meter__indicator");
    expect(indicator).toHaveAttribute("data-quality", "poor");
    // The band is still reported, it just no longer decides the colour.
    expect(indicator).toHaveAttribute("data-level", "high");
  });

  it("follows an externally changed value", async () => {
    const { rerender } = render(Meter, { props: { value: 20, label: "Storage" } });
    await rerender({ value: 60 });
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "60");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Meter, { props: { value: 50, label: "Storage" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
