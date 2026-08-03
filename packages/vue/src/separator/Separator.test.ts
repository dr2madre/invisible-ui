import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Separator } from "./Separator";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Vue Separator", () => {
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

  it("has no accessibility violations", async () => {
    const { container } = render(Separator);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
