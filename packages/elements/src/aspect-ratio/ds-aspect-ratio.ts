import { HTMLElementBase, upgradeProperty } from "../internal/base";

/** `16/9`, `16 / 9` or `1.777`; anything else, or a ratio at or below 0, is 1. */
const parseRatio = (raw: string | null): number => {
  if (raw == null || raw.trim() === "") return 1;
  const [width, height = "1", extra] = raw.split("/");
  const value = extra === undefined ? Number(width) / Number(height) : NaN;
  return Number.isFinite(value) && value > 0 ? value : 1;
};

/**
 * `<ds-aspect-ratio>` — holds its content to a width-to-height ratio with the
 * CSS `aspect-ratio` property, ported from the Svelte adapter with identical
 * classes. Presentational only (no ARIA role): its children, an image, a
 * video, an iframe or any block content, are cropped to fill the box.
 *
 * Attributes: `ratio` (width to height, as `16/9` or a number; 1 by default).
 * Properties: `ratio` (number).
 */
export class DsAspectRatio extends HTMLElementBase {
  static observedAttributes = ["ratio"];

  #root: HTMLDivElement | null = null;

  connectedCallback() {
    upgradeProperty(this, "ratio");
    if (!this.#root) {
      const root = document.createElement("div");
      root.className = "aspect-ratio";
      root.setAttribute("data-aspect-ratio", "");
      root.append(...Array.from(this.childNodes));
      this.#root = root;
      this.appendChild(root);
    }
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  get ratio(): number {
    return parseRatio(this.getAttribute("ratio"));
  }
  set ratio(next: number) {
    this.setAttribute("ratio", String(next));
  }

  #sync() {
    // A private variable set from the attribute, so an outside custom-property
    // override cannot win over it.
    this.#root!.style.setProperty("--_aspect-ratio", String(this.ratio));
  }
}
