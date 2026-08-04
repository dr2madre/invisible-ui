import { label as core } from "@design-system/core";
import { applyProps, boolAttr, HTMLElementBase } from "../internal/base";

/**
 * `<ds-label>` — a styled form label as a custom element.
 *
 * Light DOM: a real `<label>` wraps the text, so clicking it focuses the
 * control named by `for`, exactly as the platform does. The core owns the
 * association and the double-click text-selection guard.
 *
 * Attributes: `for` (id of the control), `required`.
 * Content: the label text (the element's own children).
 */
export class DsLabel extends HTMLElementBase {
  static observedAttributes = ["for", "required"];

  #label: HTMLLabelElement | null = null;

  connectedCallback() {
    if (!this.#label) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#label) this.#sync();
  }

  #render() {
    const label = document.createElement("label");
    label.className = "label";
    // The text is whatever the page put inside the tag; move it in so the
    // <label> is the element the browser associates with the control.
    while (this.firstChild) label.appendChild(this.firstChild);
    this.appendChild(label);
    this.#label = label;
  }

  #sync() {
    const label = this.#label!;
    const api = core.connect({
      state: core.initialState({ for: this.getAttribute("for") ?? undefined }),
    });
    applyProps(label, api.rootProps);

    const marker = label.querySelector(".label__required");
    if (boolAttr(this, "required")) {
      if (!marker) {
        const span = document.createElement("span");
        span.className = "label__required";
        span.setAttribute("aria-hidden", "true");
        span.textContent = "*";
        label.appendChild(span);
      }
    } else {
      marker?.remove();
    }
  }
}
