import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import type { DsAspectRatio } from "./ds-aspect-ratio";

const box = () => document.querySelector<HTMLElement>("[data-aspect-ratio]")!;
const ratio = () => Number(box().style.getPropertyValue("--_aspect-ratio"));

describe("<ds-aspect-ratio>", () => {
  it("applies the default 1:1 ratio through a private custom property", () => {
    document.body.innerHTML = `<ds-aspect-ratio><img src="x.png" alt="Example media" /></ds-aspect-ratio>`;
    expect(box()).toHaveClass("aspect-ratio");
    expect(ratio()).toBe(1);
  });

  it("reads a ratio written as a fraction or as a number", () => {
    document.body.innerHTML = `<ds-aspect-ratio ratio="16 / 9"></ds-aspect-ratio>`;
    expect(ratio()).toBeCloseTo(16 / 9);
    const element = document.querySelector("ds-aspect-ratio") as DsAspectRatio;
    element.ratio = 4 / 3;
    expect(ratio()).toBeCloseTo(4 / 3);
    element.setAttribute("ratio", "2");
    expect(ratio()).toBe(2);
  });

  it("falls back to 1 for a ratio it cannot read", () => {
    document.body.innerHTML = `<ds-aspect-ratio ratio="wide"></ds-aspect-ratio>`;
    expect(ratio()).toBe(1);
    document.querySelector("ds-aspect-ratio")!.setAttribute("ratio", "16/0");
    expect(ratio()).toBe(1);
  });

  it("keeps its children inside the box", async () => {
    document.body.innerHTML = `<ds-aspect-ratio ratio="16/9"><img src="x.png" alt="Example media" /></ds-aspect-ratio>`;
    expect(box()).toContainElement(screen.getByAltText("Example media"));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
