import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./meter.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Meter", () => {
  it("exposes the meter role with ARIA value and a band", () => {
    render(Fixture, { props: { value: 30, low: 20, high: 80 } });
    const meter = screen.getByRole("meter", { name: "Disk usage" });
    expect(meter).toHaveAttribute("aria-valuenow", "30");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(meter).toHaveAttribute("data-level", "medium");
  });

  it("flags a low band below the low threshold", () => {
    render(Fixture, { props: { value: 10, low: 20, high: 80 } });
    expect(screen.getByRole("meter")).toHaveAttribute("data-level", "low");
  });

  it("flags a high band at or above the high threshold", () => {
    render(Fixture, { props: { value: 90, low: 20, high: 80 } });
    expect(screen.getByRole("meter")).toHaveAttribute("data-level", "high");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: 50 } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
