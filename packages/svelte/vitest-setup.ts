import "@testing-library/jest-dom/vitest";
import * as matchers from "vitest-axe/matchers";
import { expect, vi } from "vitest";

vi.mock("vitest-axe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("vitest-axe")>();

  return {
    ...actual,
    axe: actual.configureAxe({
      rules: {
        "color-contrast": { enabled: false },
      },
    }),
  };
});

expect.extend(matchers);

// jsdom doesn't implement the Web Animations API; Svelte's `animate:flip`
// (FLIP) calls Element.getAnimations(). Stub it so animated lists can render.
if (typeof Element !== "undefined" && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}

// jsdom's canvas and pseudo-element style APIs are intentionally incomplete.
// axe-core may touch them in rules that are otherwise outside jsdom's remit.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext;
}

if (typeof window !== "undefined") {
  const getComputedStyle = window.getComputedStyle.bind(window);
  window.getComputedStyle = ((elt: Element) =>
    getComputedStyle(elt)) as typeof window.getComputedStyle;
}
