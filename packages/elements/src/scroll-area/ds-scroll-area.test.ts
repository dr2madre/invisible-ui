import { fireEvent, screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";

const mount = (attributes = "") => {
  document.body.innerHTML = `
    <ds-scroll-area max-height="8rem" ${attributes}>
      <p>Line one of scrollable content.</p>
      <p>Line two.</p>
    </ds-scroll-area>`;
  return document.querySelector<HTMLElement>(".scroll-area__viewport")!;
};

// jsdom has no layout: give the viewport the metrics a browser would measure.
const fakeMetrics = (viewport: HTMLElement) => {
  Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 100 });
  Object.defineProperty(viewport, "scrollHeight", { configurable: true, value: 400 });
};

describe("<ds-scroll-area>", () => {
  it("renders the content in a keyboard-focusable viewport", () => {
    const viewport = mount();
    expect(screen.getByText("Line one of scrollable content.").parentElement).toBe(viewport);
    expect(viewport).toHaveAttribute("tabindex", "0");
    expect(viewport.style.maxBlockSize).toBe("8rem");
    expect(viewport.style.overflowY).toBe("auto");
  });

  it("reflects the orientation on the root", () => {
    const viewport = mount('orientation="both"');
    expect(document.querySelector(".scroll-area")).toHaveAttribute("data-orientation", "both");
    expect(viewport.style.overflowX).toBe("auto");
  });

  it("becomes a labelled scroll region when given a label", () => {
    const viewport = mount('label="Logs"');
    expect(screen.getByRole("region", { name: "Logs" })).toBe(viewport);
    document.querySelector("ds-scroll-area")!.removeAttribute("label");
    expect(viewport).not.toHaveAttribute("role");
  });

  it("keeps its content when moved in the document", () => {
    mount();
    const element = document.querySelector("ds-scroll-area")!;
    document.body.appendChild(document.createElement("div")).appendChild(element);
    expect(element.querySelectorAll(".scroll-area__viewport")).toHaveLength(1);
    expect(screen.getByText("Line two.").parentElement).toHaveClass("scroll-area__viewport");
  });

  it("draws a decorative thumb sized from the scroll metrics", () => {
    const viewport = mount();
    fakeMetrics(viewport);
    viewport.scrollTop = 150;
    fireEvent.scroll(viewport);
    const bar = document.querySelector(".scroll-area__bar--v")!;
    expect(bar).toHaveAttribute("aria-hidden", "true");
    const thumb = bar.querySelector<HTMLElement>(".scroll-area__thumb")!;
    expect(thumb.style.blockSize).toBe("25%");
    expect(thumb.style.insetBlockStart).not.toBe("0%");
  });

  it("scrolls the viewport when the thumb is dragged", () => {
    const viewport = mount();
    fakeMetrics(viewport);
    fireEvent.scroll(viewport);
    const thumb = document.querySelector<HTMLElement>(".scroll-area__thumb")!;
    fireEvent.pointerDown(thumb, { clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(thumb, { clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(thumb, { clientY: 10, pointerId: 1 });
    expect(viewport.scrollTop).toBeGreaterThan(0);
  });

  it("has no accessibility violations", async () => {
    mount('label="Logs"');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
