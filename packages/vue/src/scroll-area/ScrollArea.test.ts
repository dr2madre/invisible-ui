import { fireEvent, render, screen } from "@testing-library/vue";
import { h } from "vue";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

describe("Vue ScrollArea in right-to-left text", () => {
  // jsdom has no layout; in right-to-left text scrollLeft goes negative toward the inline end.
  const sizes = { scrollHeight: 100, clientHeight: 100, scrollWidth: 400, clientWidth: 100 };
  beforeEach(() => {
    for (const [key, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => value });
    }
    document.documentElement.dir = "rtl";
  });
  afterEach(() => {
    for (const key of Object.keys(sizes)) {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
    }
    document.documentElement.removeAttribute("dir");
  });

  it("places the horizontal thumb from the inline start and drags it toward the inline end", async () => {
    render(ScrollArea, { props: { orientation: "horizontal" }, slots });
    viewport().scrollLeft = -150;
    await fireEvent.scroll(viewport());
    const thumb = document.querySelector<HTMLElement>(".scroll-area__bar--h .scroll-area__thumb")!;
    expect(thumb.style.insetInlineStart).toBe("37.5%");
    await fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 30 });
    await fireEvent.pointerMove(thumb, { pointerId: 1, clientX: 10 });
    expect(viewport().scrollLeft).toBe(-230);
  });
});
