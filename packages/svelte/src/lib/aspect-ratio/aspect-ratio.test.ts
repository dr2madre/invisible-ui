import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./aspect-ratio.fixture.svelte";

describe("AspectRatio", () => {
  it("applies the default 1:1 ratio via a custom property", () => {
    const { container } = render(Fixture);
    const box = container.querySelector("[data-aspect-ratio]")!;
    expect(box.getAttribute("style")).toContain("--ds-aspect-ratio: 1");
  });

  it("applies a custom ratio", () => {
    const { container } = render(Fixture, { props: { ratio: 16 / 9 } });
    const box = container.querySelector("[data-aspect-ratio]")!;
    expect(box.getAttribute("style")).toContain("--ds-aspect-ratio: 1.777");
  });

  it("renders slotted media", () => {
    render(Fixture);
    expect(screen.getByAltText("Example media")).toBeInTheDocument();
  });
});
