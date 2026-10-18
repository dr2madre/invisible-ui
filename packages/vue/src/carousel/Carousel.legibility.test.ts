import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Carousel, type CarouselSlide } from "./Carousel";

const many = (length: number): CarouselSlide[] =>
  Array.from({ length }, (_, i) => ({ title: `Slide ${i + 1}` }));

/**
 * The worst case under the title is a white image: white text over the
 * overlay's lowest alpha. WCAG 2.2 AA asks 4.5:1 for normal text; measured
 * values: top stop 0 gave 1.00:1, 0.55 gives 4.76:1, the 0.7 base 8.52:1.
 */
const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const whiteOverBlackAlpha = (alpha: number) => {
  const background = lin(255 * (1 - alpha));
  return (1 + 0.05) / (background + 0.05);
};

const overlayStops = (css: string) => {
  const rule = /\.carousel__overlay\s*\{([^}]*)\}/.exec(css);
  expect(rule, "the overlay rule").not.toBeNull();
  return [...rule![1]!.matchAll(/rgba\(0,\s*0,\s*0,\s*([\d.]+)\)/g)].map((m) => Number(m[1]));
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Vue Carousel legibility", () => {
  it("never fades a coverflow neighbour, and hides the slides past two places", () => {
    render(Carousel, { props: { items: many(6), variant: "coverflow", label: "Places" } });
    const opacity = (index: number) =>
      document.querySelector<HTMLElement>(`[data-index="${index}"]`)!.style.opacity;
    expect([0, 1, 2].map(opacity)).toEqual(["1", "1", "1"]);
    expect([3, 4, 5].map(opacity)).toEqual(["0", "0", "0"]);
  });

  it("keeps white title text at 4.5:1 or better under every stop of the overlay", () => {
    const css = readFileSync(resolve(import.meta.dirname, "../styles/carousel.css"), "utf8");
    const stops = overlayStops(css);
    expect(stops.length).toBeGreaterThanOrEqual(2);
    for (const alpha of stops) expect(whiteOverBlackAlpha(alpha)).toBeGreaterThanOrEqual(4.5);
  });

  it("stops the slide track and the coverflow slides animating under reduced motion", () => {
    const css = readFileSync(resolve(import.meta.dirname, "../styles/carousel.css"), "utf8");
    const block = /@media \(prefers-reduced-motion: reduce\) \{([^]*?)\n\}/.exec(css)![1]!;
    expect(block).toContain(".carousel__track");
    expect(block).toContain('.carousel[data-variant="coverflow"] .carousel__slide');
    expect(block).toMatch(/transition:\s*none/);
  });

  it("scrolls the gallery without animation under reduced motion", async () => {
    const behaviours: unknown[] = [];
    Element.prototype.scrollTo = ((options: ScrollToOptions) => {
      behaviours.push(options.behavior);
    }) as typeof Element.prototype.scrollTo;
    const media = (matches: boolean) =>
      vi.stubGlobal("matchMedia", (query: string) => ({ matches, media: query }));

    const user = userEvent.setup();
    media(true);
    const first = render(Carousel, {
      props: { items: many(3), variant: "gallery", label: "Places" },
    });
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    await Promise.resolve();
    expect(behaviours.at(-1)).toBe("auto");
    first.unmount();

    media(false);
    render(Carousel, { props: { items: many(3), variant: "gallery", label: "Places" } });
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    await Promise.resolve();
    expect(behaviours.at(-1)).toBe("smooth");
  });
});
