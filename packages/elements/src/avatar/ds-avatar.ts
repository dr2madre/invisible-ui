import { HTMLElementBase } from "../internal/base";

// A user-perceived character, not a UTF-16 code unit: an emoji or a combined
// character counts as one initial. Falls back to code units where the runtime
// has no segmenter.
function firstGraphemes(text: string, count: number): string {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segments = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text);
    let out = "";
    let taken = 0;
    for (const segment of segments) {
      out += segment.segment;
      taken += 1;
      if (taken === count) break;
    }
    return out;
  }
  return text.slice(0, count);
}

/** Derive up to two initials from a name (first + last word). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return firstGraphemes(parts[0]!, 2).toUpperCase();
  return (firstGraphemes(parts[0]!, 1) + firstGraphemes(parts[parts.length - 1]!, 1)).toUpperCase();
}

/**
 * `<ds-avatar>` — a small account image that falls back to the account's
 * initials when no image is set or the image fails to load. Ported from the
 * Svelte adapter, class names kept identical.
 *
 * The whole avatar is one image to assistive technology (`role="img"` and
 * `aria-label`), so it reads the same whether the photo or the initials show.
 *
 * Attributes: `name` (required: the accessible name and the initials), `src`,
 * `alt` (overrides the accessible name), `size` (sm|md|lg), `shape`
 * (circle|square).
 */
export class DsAvatar extends HTMLElementBase {
  static observedAttributes = ["name", "src", "alt", "size", "shape"];

  #root: HTMLSpanElement | null = null;
  #failedSrc: string | null = null;

  connectedCallback() {
    if (!this.#root) {
      this.#root = document.createElement("span");
      this.#root.className = "avatar";
      this.#root.setAttribute("role", "img");
      this.appendChild(this.#root);
    }
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#root) this.#render();
  }

  #render() {
    const root = this.#root!;
    const name = this.getAttribute("name") ?? "";
    const src = this.getAttribute("src");
    const size = this.getAttribute("size");
    const shape = this.getAttribute("shape");
    root.dataset.size = size === "sm" || size === "lg" ? size : "md";
    root.dataset.shape = shape === "square" ? "square" : "circle";
    root.setAttribute("aria-label", this.getAttribute("alt") ?? name);

    root.textContent = "";
    if (src && src !== this.#failedSrc) {
      const img = document.createElement("img");
      img.className = "avatar__img";
      img.alt = "";
      img.addEventListener("error", () => {
        this.#failedSrc = src;
        this.#render();
      });
      img.src = src;
      root.appendChild(img);
    } else {
      const initials = document.createElement("span");
      initials.className = "avatar__initials";
      initials.setAttribute("aria-hidden", "true");
      initials.textContent = initialsOf(name);
      root.appendChild(initials);
    }
  }
}
