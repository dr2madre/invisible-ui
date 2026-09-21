import { boolAttr, HTMLElementBase, upgradeProperty } from "../internal/base";

export type SeparatorOrientation = "horizontal" | "vertical";

/**
 * `<ds-separator>` renders a semantic or decorative divider.
 *
 * Attributes: `orientation` (`horizontal` or `vertical`), `decorative`.
 */
export class DsSeparator extends HTMLElementBase {
  static observedAttributes = ["orientation", "decorative"];

  #root: HTMLDivElement | null = null;

  connectedCallback() {
    upgradeProperty(this, "decorative");
    if (!this.#root) {
      this.#root = document.createElement("div");
      this.#root.className = "separator";
      this.appendChild(this.#root);
    }
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  get decorative(): boolean {
    return boolAttr(this, "decorative");
  }
  set decorative(value: boolean) {
    if (value) this.setAttribute("decorative", "");
    else this.removeAttribute("decorative");
  }

  #sync() {
    const orientation = this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
    this.#root!.dataset.orientation = orientation;
    this.#root!.setAttribute("role", this.decorative ? "none" : "separator");
    if (this.decorative) this.#root!.removeAttribute("aria-orientation");
    else this.#root!.setAttribute("aria-orientation", orientation);
  }
}
