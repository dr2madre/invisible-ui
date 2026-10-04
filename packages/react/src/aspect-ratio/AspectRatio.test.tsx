import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { AspectRatio } from "./AspectRatio";

describe("React AspectRatio", () => {
  const box = () => document.querySelector<HTMLElement>(".aspect-ratio")!;

  it("applies the default 1:1 ratio through a custom property", () => {
    render(<AspectRatio />);
    expect(box().style.getPropertyValue("--_aspect-ratio")).toBe("1");
    expect(box()).toHaveAttribute("data-aspect-ratio");
  });

  it("applies a custom ratio", () => {
    render(<AspectRatio ratio={16 / 9} />);
    expect(Number(box().style.getPropertyValue("--_aspect-ratio"))).toBeCloseTo(16 / 9);
  });

  it("renders its media", () => {
    render(
      <AspectRatio ratio={4 / 3}>
        <img src="/photo.jpg" alt="A harbour at dawn" />
      </AspectRatio>,
    );
    expect(screen.getByRole("img", { name: "A harbour at dawn" }).parentElement).toBe(box());
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <img src="/photo.jpg" alt="A harbour at dawn" />
      </AspectRatio>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
