import { HTMLElementBase } from "../internal/base";

export type SkeletonVariant = "text" | "circle" | "rect";
export type SkeletonAnimation = "pulse" | "wave" | "none";

const VARIANTS: readonly SkeletonVariant[] = ["text", "circle", "rect"];
const ANIMATIONS: readonly SkeletonAnimation[] = ["pulse", "wave", "none"];

/**
 * `<ds-skeleton>` — a loading placeholder in the shape of the content it
 * stands for, ported from the Svelte adapter with identical classes. Three
 * shapes: `text` (one or more lines, the last one shorter), `circle` (an
 * avatar) and `rect` (an image or a card).
 *
 * A skeleton is decoration, so it is hidden from assistive technology: set
 * `aria-busy="true"` on the region that is loading. With a `label` it becomes
 * a polite `role="status"` with that name instead. The animation stops under
 * `prefers-reduced-motion`.
 *
 * Attributes: `variant` (text|circle|rect), `lines` (the text lines; 1 by
 * default), `width` (a CSS length; for `circle`, the height too), `height` (a
 * CSS length; `text` follows the line height), `radius` (a CSS length),
 * `animation` (pulse|wave|none), `label` (turns the skeleton into a named
 * status).
 */
export class DsSkeleton extends HTMLElementBase {
  static observedAttributes = [
    "variant",
    "lines",
    "width",
    "height",
    "radius",
    "animation",
    "label",
  ];

  #root: HTMLDivElement | null = null;

  connectedCallback() {
    if (!this.#root) {
      this.#root = document.createElement("div");
      this.#root.className = "skeleton";
      this.replaceChildren(this.#root);
    }
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#root) this.#render();
  }

  #render() {
    const root = this.#root!;
    const variant = pick(this.getAttribute("variant"), VARIANTS, "text");
    const label = this.getAttribute("label") || null;
    root.dataset.variant = variant;
    root.dataset.animation = pick(this.getAttribute("animation"), ANIMATIONS, "pulse");
    if (label) {
      root.setAttribute("role", "status");
      root.setAttribute("aria-label", label);
      root.setAttribute("aria-busy", "true");
      root.removeAttribute("aria-hidden");
    } else {
      for (const name of ["role", "aria-label", "aria-busy"]) root.removeAttribute(name);
      root.setAttribute("aria-hidden", "true");
    }

    const width = this.getAttribute("width") ?? "";
    const height = this.getAttribute("height") ?? "";
    const radius = this.getAttribute("radius") ?? "";
    const bars: HTMLSpanElement[] = [];
    if (variant === "text") {
      const lines = Math.max(1, Math.floor(Number(this.getAttribute("lines") ?? 1)) || 1);
      for (let index = 0; index < lines; index += 1) {
        const bar = document.createElement("span");
        bar.className = "skeleton__bar skeleton__line";
        bar.style.width = index === lines - 1 && lines > 1 ? "60%" : width;
        bar.style.borderRadius = radius;
        bars.push(bar);
      }
    } else {
      const bar = document.createElement("span");
      bar.className = variant === "circle" ? "skeleton__bar skeleton__circle" : "skeleton__bar";
      bar.style.width = width;
      bar.style.height = variant === "circle" ? width || height : height;
      bar.style.borderRadius = radius;
      bars.push(bar);
    }
    root.replaceChildren(...bars);
  }
}

const pick = <T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(raw as T) ? (raw as T) : fallback;
