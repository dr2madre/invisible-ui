import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Meter from "./Meter.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Meter (styled)", () => {
  it("renders a labelled meter and sizes the fill", () => {
    const { container } = render(Meter, { props: { value: 75, label: "Storage" } });
    const meter = screen.getByRole("meter", { name: "Storage" });
    expect(meter).toHaveAttribute("aria-valuenow", "75");
    const fill = container.querySelector(".meter__indicator")!;
    expect(fill.getAttribute("style")).toContain("inline-size: 75%");
  });

  it("reflects the level on the fill for color coding", () => {
    const { container } = render(Meter, {
      props: { value: 95, low: 20, high: 80, label: "Storage" },
    });
    expect(container.querySelector(".meter__indicator")).toHaveAttribute("data-level", "high");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Meter, { props: { value: 50, label: "Storage" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
