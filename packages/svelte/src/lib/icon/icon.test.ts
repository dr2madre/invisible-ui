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
});
