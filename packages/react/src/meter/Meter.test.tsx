import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Meter } from "./Meter";

const indicator = () => document.querySelector<HTMLElement>(".meter__indicator")!;

describe("React Meter", () => {
  it("renders a labelled meter and sizes the fill", () => {
    render(<Meter value={30} label="Storage" />);
    const meter = screen.getByRole("meter", { name: "Storage" });
    expect(meter).toHaveAttribute("aria-valuenow", "30");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(indicator().style.inlineSize).toBe("30%");
  });

  it("reflects the band on the fill", () => {
    const { rerender } = render(<Meter value={10} low={20} high={80} label="Battery" />);
    expect(indicator()).toHaveAttribute("data-level", "low");
    rerender(<Meter value={90} low={20} high={80} label="Battery" />);
    expect(indicator()).toHaveAttribute("data-level", "high");
  });

  it("colours by how good the value is, not by which band it sits in", () => {
    const { unmount } = render(<Meter value={90} low={20} high={60} label="Battery" />);
    expect(indicator()).toHaveAttribute("data-quality", "optimal");
    unmount();

    render(<Meter value={90} low={50} high={80} optimum={0} label="Disk" />);
    expect(indicator()).toHaveAttribute("data-quality", "poor");
    expect(indicator()).toHaveAttribute("data-level", "high");
  });

  it("reflects a value change after mount everywhere, not only in the label", () => {
    const { rerender } = render(<Meter value={90} low={20} high={60} label="Battery" />);
    rerender(<Meter value={10} low={20} high={60} label="Battery" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "10");
    expect(indicator()).toHaveAttribute("data-quality", "poor");
    expect(indicator().style.inlineSize).toBe("10%");
  });

  it("follows a range change after mount, not only a value change", () => {
    const { rerender } = render(<Meter value={50} low={20} high={60} label="Battery" />);
    expect(indicator()).toHaveAttribute("data-level", "medium");

    rerender(<Meter value={50} min={0} max={200} low={60} high={150} label="Battery" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuemax", "200");
    expect(indicator()).toHaveAttribute("data-level", "low");
    expect(indicator()).toHaveAttribute("data-quality", "poor");
    expect(indicator().style.inlineSize).toBe("25%");

    rerender(
      <Meter value={50} min={0} max={200} low={60} high={150} optimum={0} label="Battery" />,
    );
    expect(indicator()).toHaveAttribute("data-quality", "optimal");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Meter value={50} label="Storage" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
