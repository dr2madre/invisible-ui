import { render, screen } from "@testing-library/vue";
import { h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ScrollArea } from "./ScrollArea";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const slots = {
  default: () => [
    h("p", "Line one of scrollable content."),
    h("p", "Line two."),
    h("p", "Line three."),
    h("p", "Line four."),
    h("p", "Line five, keep scrolling."),
  ],
};

const viewport = () => document.querySelector<HTMLElement>(".scroll-area__viewport")!;

describe("Vue ScrollArea", () => {
  it("renders the content in a keyboard-focusable viewport", () => {
    render(ScrollArea, { props: { maxHeight: "8rem" }, slots });
    expect(screen.getByText("Line one of scrollable content.")).toBeInTheDocument();
    // The viewport is focusable so keyboard users can scroll it.
    expect(viewport()).toHaveAttribute("tabindex", "0");
  });

  it("reflects the orientation on the root", () => {
    render(ScrollArea, { props: { orientation: "both" }, slots });
    expect(document.querySelector(".scroll-area")).toHaveAttribute("data-orientation", "both");
  });

  it("constrains the viewport to maxHeight", () => {
    render(ScrollArea, { props: { maxHeight: "8rem" }, slots });
    expect(viewport().getAttribute("style")).toContain("max-block-size: 8rem");
  });

  it("becomes a labelled scroll region when given a label", () => {
    render(ScrollArea, { props: { label: "Logs" }, slots });
    expect(screen.getByRole("region", { name: "Logs" })).toBe(viewport());
  });

  it("has no accessibility violations", async () => {
    const { container } = render(ScrollArea, { props: { label: "Logs" }, slots });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
