import { boolAttr, HTMLElementBase, syncAttribute, upgradeProperty } from "../internal/base";

export type LinkVariant = "primary" | "subtle";

const SVG_NS = "http://www.w3.org/2000/svg";

/** The arrow that marks a link opening in a new tab. */
function externalIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  for (const [name, value] of [
    ["class", "link__external"],
    ["viewBox", "0 0 24 24"],
    ["width", "0.85em"],
    ["height", "0.85em"],
    ["fill", "none"],
    ["stroke", "currentColor"],
    ["stroke-width", "2"],
    ["stroke-linecap", "round"],
    ["stroke-linejoin", "round"],
    ["aria-hidden", "true"],
    ["focusable", "false"],
  ]) {
    svg.setAttribute(name!, value!);
  }
  for (const d of ["M7 17 17 7", "M8 7h9v9"]) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
}

/**
 * `<ds-link>` renders a styled inline text link with a semantic `<a>`. Its
 * children become the link text.
 *
 * `href` is required: a link navigates. An anchor without a destination is not
 * focusable and carries no link semantics, so an in-page action belongs to
 * `<ds-button>`. Set `external` for a link that opens in a new tab: it adds
 * `target="_blank"` with a safe `rel`, and a decorative arrow marks it.
 *
 * Attributes: `href` (required), `external`, `variant` (primary|subtle).
 * The native `click` event bubbles from the `<a>` to the element, for the work
 * that accompanies a navigation, such as analytics.
 */
export class DsLink extends HTMLElementBase {
  static observedAttributes = ["href", "external", "variant"];

  #anchor: HTMLAnchorElement | null = null;
  #icon: SVGSVGElement | null = null;

  connectedCallback() {
    upgradeProperty(this, "external");
    if (!this.#anchor) {
      const anchor = document.createElement("a");
      anchor.className = "link";
      while (this.firstChild) anchor.appendChild(this.firstChild);
      this.appendChild(anchor);
      this.#anchor = anchor;
    }
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#anchor) this.#sync();
  }

  get external(): boolean {
    return boolAttr(this, "external");
  }
  set external(value: boolean) {
    if (value) this.setAttribute("external", "");
    else this.removeAttribute("external");
  }

  #sync() {
    const anchor = this.#anchor!;
    anchor.dataset.variant = this.getAttribute("variant") === "subtle" ? "subtle" : "primary";
    syncAttribute(this, anchor, "href");

    if (this.external) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      if (!this.#icon) {
        this.#icon = externalIcon();
        anchor.appendChild(this.#icon);
      }
    } else {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
      this.#icon?.remove();
      this.#icon = null;
    }
  }
}
