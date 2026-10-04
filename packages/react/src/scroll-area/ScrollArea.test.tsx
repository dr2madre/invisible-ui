import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ScrollArea } from "./ScrollArea";

const content = (
  <div>
    <p>Line one of scrollable content.</p>
    <p>Line two.</p>
    <p>Line three.</p>
  </div>
);

const viewport = () => document.querySelector<HTMLElement>(".scroll-area__viewport")!;

describe("React ScrollArea", () => {
  it("renders the content in a keyboard-focusable viewport", () => {
    render(<ScrollArea>{content}</ScrollArea>);
    expect(screen.getByText("Line one of scrollable content.")).toBeInTheDocument();
    expect(viewport()).toHaveAttribute("tabindex", "0");
    expect(viewport()).not.toHaveAttribute("role");
  });

  it("reflects the orientation and constrains the viewport", () => {
    render(
      <ScrollArea orientation="both" maxHeight="8rem">
        {content}
      </ScrollArea>,
    );
    expect(document.querySelector(".scroll-area")).toHaveAttribute("data-orientation", "both");
    expect(viewport().style.maxBlockSize).toBe("8rem");
    expect(viewport().style.overflow).toBe("auto");
  });

  it("becomes a labelled region when given a label", () => {
    render(<ScrollArea label="Logs">{content}</ScrollArea>);
    expect(screen.getByRole("region", { name: "Logs" })).toBe(viewport());
  });

  it("draws no scrollbar while nothing overflows", () => {
    render(<ScrollArea>{content}</ScrollArea>);
    expect(document.querySelector(".scroll-area__bar")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ScrollArea label="Logs">{content}</ScrollArea>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React ScrollArea with overflowing content", () => {
  // jsdom has no layout, so the viewport reports a fixed geometry: content
  // four times taller than the viewport.
  const sizes = { scrollHeight: 400, clientHeight: 100, scrollWidth: 100, clientWidth: 100 };
  beforeEach(() => {
    for (const [key, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => value });
    }
  });
  afterEach(() => {
    for (const key of Object.keys(sizes)) {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
    }
  });

  it("sizes and places the vertical thumb from the core geometry", () => {
    render(<ScrollArea>{content}</ScrollArea>);
    const thumb = document.querySelector<HTMLElement>(".scroll-area__bar--v .scroll-area__thumb")!;
    expect(thumb.parentElement).toHaveAttribute("aria-hidden", "true");
    expect(thumb.style.blockSize).toBe("25%");
    expect(document.querySelector(".scroll-area__bar--h")).toBeNull();

    viewport().scrollTop = 150;
    fireEvent.scroll(viewport());
    expect(thumb.style.insetBlockStart).toBe("37.5%");
  });

  it("scrolls the viewport when the thumb is dragged", () => {
    render(<ScrollArea>{content}</ScrollArea>);
    const thumb = document.querySelector<HTMLElement>(".scroll-area__thumb")!;
    fireEvent.pointerDown(thumb, { pointerId: 1, clientY: 10 });
    fireEvent.pointerMove(thumb, { pointerId: 1, clientY: 30 });
    // 20px of thumb travel over a 75px track moves 300px of content by 80px.
    expect(viewport().scrollTop).toBe(80);
    fireEvent.pointerUp(thumb, { pointerId: 1 });
    fireEvent.pointerMove(thumb, { pointerId: 1, clientY: 60 });
    expect(viewport().scrollTop).toBe(80);
  });
});
