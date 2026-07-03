import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./icon.fixture.svelte";

describe("Icon", () => {
  it("is decorative by default (hidden from assistive tech)", () => {
    const { container } = render(Fixture);
    const svg = container.querySelector("svg.icon")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("width", "1em");
  });

  it("becomes a labelled image when given a label", () => {
    render(Fixture, { props: { label: "Done" } });
    const icon = screen.getByRole("img", { name: "Done" });
    expect(icon).not.toHaveAttribute("aria-hidden");
  });

  it("applies a custom size to width and height", () => {
    const { container } = render(Fixture, { props: { size: "2rem" } });
    const svg = container.querySelector("svg.icon")!;
    expect(svg).toHaveAttribute("width", "2rem");
    expect(svg).toHaveAttribute("height", "2rem");
  });

  it("has no animation hook by default", () => {
    const { container } = render(Fixture);
    expect(container.querySelector("svg.icon")).not.toHaveAttribute("data-animation");
  });

  it("exposes the animation as a data hook with a custom duration", () => {
    const { container } = render(Fixture, {
      props: { animation: "spin", animationDuration: "0.8s" },
    });
    const svg = container.querySelector<SVGElement>("svg.icon")!;
    expect(svg).toHaveAttribute("data-animation", "spin");
    expect(svg.style.getPropertyValue("--ds-icon-animation-duration")).toBe("0.8s");
  });
});
