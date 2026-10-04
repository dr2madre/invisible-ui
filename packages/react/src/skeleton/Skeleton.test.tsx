import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Skeleton } from "./Skeleton";

const root = () => document.querySelector<HTMLElement>(".skeleton")!;

describe("React Skeleton", () => {
  it("is hidden from assistive tech by default", () => {
    render(<Skeleton />);
    expect(root()).toHaveAttribute("aria-hidden", "true");
    expect(root()).not.toHaveAttribute("role");
  });

  it("renders one bar per line for the text variant, the last one shorter", () => {
    render(<Skeleton lines={3} width="12rem" />);
    const lines = document.querySelectorAll<HTMLElement>(".skeleton__line");
    expect(lines).toHaveLength(3);
    expect(lines[0]!.style.width).toBe("12rem");
    expect(lines[2]!.style.width).toBe("60%");
  });

  it("renders a single circle sized by its width", () => {
    render(<Skeleton variant="circle" width="3rem" />);
    const circle = document.querySelector<HTMLElement>(".skeleton__circle")!;
    expect(document.querySelectorAll(".skeleton__bar")).toHaveLength(1);
    expect(circle.style.width).toBe("3rem");
    expect(circle.style.height).toBe("3rem");
  });

  it("sizes a rect and overrides its radius", () => {
    render(<Skeleton variant="rect" width="100%" height="8rem" radius="4px" />);
    const rect = document.querySelector<HTMLElement>(".skeleton__bar")!;
    expect(rect).not.toHaveClass("skeleton__circle");
    expect(rect.style.height).toBe("8rem");
    expect(rect.style.borderRadius).toBe("4px");
  });

  it("becomes a polite, busy status with a name when labelled", () => {
    render(<Skeleton label="Loading profile" />);
    const status = screen.getByRole("status", { name: "Loading profile" });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).not.toHaveAttribute("aria-hidden");
  });

  it("reflects the variant and the animation", () => {
    render(<Skeleton variant="rect" animation="wave" />);
    expect(root()).toHaveAttribute("data-variant", "rect");
    expect(root()).toHaveAttribute("data-animation", "wave");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Skeleton label="Loading" lines={2} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
