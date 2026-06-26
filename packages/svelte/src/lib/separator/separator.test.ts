import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Separator from "./Separator.svelte";

describe("Separator", () => {
  it("is a horizontal separator by default", () => {
    const { container } = render(Separator);
    const el = container.querySelector(".separator")!;
    expect(el).toHaveAttribute("role", "separator");
    expect(el).toHaveAttribute("aria-orientation", "horizontal");
    expect(el).toHaveAttribute("data-orientation", "horizontal");
  });

  it("supports a vertical orientation", () => {
    const { container } = render(Separator, { props: { orientation: "vertical" } });
    expect(container.querySelector(".separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("is hidden from assistive tech when decorative", () => {
    const { container } = render(Separator, { props: { decorative: true } });
    const el = container.querySelector(".separator")!;
    expect(el).toHaveAttribute("role", "none");
    expect(el).not.toHaveAttribute("aria-orientation");
  });
});
