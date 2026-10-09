import { avatar } from "@design-system/core";
import { HTMLElementBase } from "../internal/base";

/**
 * Up to two initials from a name (first and last word), counted in
 * user-perceived characters. The logic lives in `@design-system/core`.
 */
export function initialsOf(name: string): string {
  return avatar.initialsOf(name);
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
