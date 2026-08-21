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

  it("colours by how good the value is, not by which band it sits in", () => {
    // Battery: full is good, so a high value is the good case.
    const { unmount } = render(Meter, {
      props: { label: "Battery", value: 90, low: 20, high: 60 },
    });
    expect(document.querySelector(".meter__indicator")).toHaveAttribute("data-quality", "optimal");
    unmount();

    // Disk usage: empty is good, so the same high value is the bad case.
    render(Meter, {
      props: { label: "Disk", value: 90, low: 50, high: 80, optimum: 0 },
    });
    const indicator = document.querySelector(".meter__indicator");
    expect(indicator).toHaveAttribute("data-quality", "poor");
    // The band is still reported, it just no longer decides the colour.
    expect(indicator).toHaveAttribute("data-level", "high");
  });

  it("reflects a value change after mount everywhere, not only in the label", async () => {
    const { rerender } = render(Meter, {
      props: { label: "Battery", value: 90, low: 20, high: 60 },
    });
    const indicator = () => document.querySelector(".meter__indicator") as HTMLElement;
    expect(indicator()).toHaveAttribute("data-quality", "optimal");

    await rerender({ label: "Battery", value: 10, low: 20, high: 60 });
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "10");
    // The fill and its judgement have to follow the value, not stay at the
    // one the meter was created with.
    expect(indicator()).toHaveAttribute("data-quality", "poor");
    expect(indicator().style.inlineSize).toBe("10%");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Meter, { props: { value: 50, label: "Storage" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
