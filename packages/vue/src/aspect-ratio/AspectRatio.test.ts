import { render, screen } from "@testing-library/vue";
import { h } from "vue";
import { describe, expect, it } from "vitest";
import { AspectRatio } from "./AspectRatio";

const media = () => h("img", { src: "/example.jpg", alt: "Example media" });

describe("Vue AspectRatio", () => {
  it("applies the default 1:1 ratio via a custom property", () => {
    const { container } = render(AspectRatio, { slots: { default: media } });
    const box = container.querySelector("[data-aspect-ratio]")!;
    expect(box.getAttribute("style")).toContain("--_aspect-ratio: 1");
  });

  it("applies a custom ratio", () => {
    const { container } = render(AspectRatio, {
      props: { ratio: 16 / 9 },
      slots: { default: media },
    });
    const box = container.querySelector("[data-aspect-ratio]")!;
    expect(box.getAttribute("style")).toContain("--_aspect-ratio: 1.777");
  });

  it("renders slotted media", () => {
    render(AspectRatio, { slots: { default: media } });
    expect(screen.getByAltText("Example media")).toBeInTheDocument();
  });
});
