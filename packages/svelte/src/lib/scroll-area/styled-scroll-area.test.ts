import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./scroll-area.fixture.svelte";

const viewport = () => document.querySelector<HTMLElement>(".scroll-area__viewport")!;

describe("Svelte ScrollArea (styled)", () => {
  it("renders the content in a keyboard-focusable viewport", () => {
    render(Fixture);
    expect(screen.getByText("Line one of scrollable content.")).toBeInTheDocument();
    // The viewport is focusable so keyboard users can scroll it.
    expect(viewport()).toHaveAttribute("tabindex", "0");
  });

  it("reflects the orientation on the root", () => {
    render(Fixture, { props: { orientation: "both" } });
    expect(document.querySelector(".scroll-area")).toHaveAttribute("data-orientation", "both");
  });

  it("becomes a labelled scroll region when given a label", () => {
    render(Fixture, { props: { label: "Logs" } });
    expect(screen.getByRole("region", { name: "Logs" })).toBe(viewport());
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { label: "Logs" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Svelte ScrollArea in right-to-left text", () => {
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
    render(Fixture, { props: { orientation: "horizontal" } });
    viewport().scrollLeft = -150;
    await fireEvent.scroll(viewport());
    const thumb = document.querySelector<HTMLElement>(".scroll-area__bar--h .scroll-area__thumb")!;
    expect(thumb.style.insetInlineStart).toBe("37.5%");
    await fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 30 });
    await fireEvent.pointerMove(thumb, { pointerId: 1, clientX: 10 });
    expect(viewport().scrollLeft).toBe(-230);
  });
});
