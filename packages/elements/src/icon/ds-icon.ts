import { HTMLElementBase } from "../internal/base";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * `<ds-icon>` renders a standardized SVG glyph: a 24×24 viewBox, `1em`
 * sizing, `currentColor` and rounded stroke joins, the same wrapper as the
 * other adapters' Icon.
 *
 * The glyph comes from `path` (an SVG path `d` string, set as an attribute and
 * never parsed as markup) or from a child `<svg>`, whose shapes are moved in
 * once at render. Shapes outside an `<svg>` parse as HTML, so they need that
 * wrapper. When `path` is set it replaces the child shapes.
 *
 * Decorative by default (`aria-hidden`); set `label` to expose it as an image
 * with an accessible name.
 *
 * Attributes: `path`, `size`, `view-box`, `stroke-width`, `label`.
 */
export class DsIcon extends HTMLElementBase {
  static observedAttributes = ["path", "size", "view-box", "stroke-width", "label"];

  #svg: SVGSVGElement | null = null;
  #shapes: Node[] = [];
  #childViewBox: string | null = null;

  connectedCallback() {
    if (!this.#svg) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#svg) this.#sync();
  }

  #render() {
    const source = Array.from(this.children).find(
      (child): child is SVGSVGElement => child instanceof SVGSVGElement,
    );
    if (source) {
      this.#shapes = Array.from(source.childNodes);
      this.#childViewBox = source.getAttribute("viewBox");
    }
    this.textContent = "";

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("focusable", "false");
    svg.style.display = "inline-block";
    svg.style.flex = "none";
    svg.style.verticalAlign = "middle";
    this.appendChild(svg);
    this.#svg = svg;
  }

  #sync() {
    const svg = this.#svg!;
    const size = this.getAttribute("size") || "1em";
    svg.setAttribute("viewBox", this.getAttribute("view-box") ?? this.#childViewBox ?? "0 0 24 24");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("stroke-width", this.getAttribute("stroke-width") || "2");

    const label = this.getAttribute("label");
    if (label) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", label);
      svg.removeAttribute("aria-hidden");
    } else {
      svg.removeAttribute("role");
      svg.removeAttribute("aria-label");
      svg.setAttribute("aria-hidden", "true");
    }

    const d = this.getAttribute("path");
    svg.textContent = "";
    if (d) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    } else {
      svg.append(...this.#shapes);
    }
  }
}
