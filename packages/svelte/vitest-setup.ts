import "@testing-library/jest-dom/vitest";
import * as matchers from "vitest-axe/matchers";
import { expect } from "vitest";

expect.extend(matchers);

// jsdom doesn't implement the Web Animations API; Svelte's `animate:flip`
// (FLIP) calls Element.getAnimations(). Stub it so animated lists can render.
if (typeof Element !== "undefined" && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}
