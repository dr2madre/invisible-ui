import { HTMLElementBase } from "../internal/base";
import { feedbackIcon, type FeedbackStatus } from "../internal/icons";

export type { FeedbackStatus };

const STATUSES: readonly FeedbackStatus[] = ["info", "success", "warning", "danger", "neutral"];

/**
 * `<ds-feedback-icon>` — a status glyph in a rounded, colored box, ported from
 * the Svelte adapter with identical classes. It shows the type of feedback
 * (info, success, warning, danger, neutral) at a glance.
 *
 * A built-in glyph is drawn per status. Element children replace it: they are
 * captured once, on the first connection. The box is decorative by default
 * (`aria-hidden`); set `label` to expose it as an image with that name.
 * Colors are themeable CSS custom properties (`--ds-feedback-icon-*`).
 *
 * Attributes: `status` (info|success|warning|danger|neutral; "info" by default),
 * `label` (the accessible name), `box` (tint|transparent|solid; "tint" by
 * default), `shape` (rounded|round; "rounded" by default).
 */
export class DsFeedbackIcon extends HTMLElementBase {
  static observedAttributes = ["status", "label", "box", "shape"];

  #root: HTMLSpanElement | null = null;
  #custom: Node[] = [];

  connectedCallback() {
    if (!this.#root) {
      // Whitespace between tags is not a glyph.
      this.#custom = Array.from(this.childNodes).filter(
        (node) => node.nodeType !== Node.TEXT_NODE || node.textContent?.trim(),
      );
      this.textContent = "";
      this.#root = document.createElement("span");
      this.#root.className = "feedback-icon";
      this.appendChild(this.#root);
    }
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#root) this.#render();
  }

  #status(): FeedbackStatus {
    const value = this.getAttribute("status") as FeedbackStatus | null;
    return value && STATUSES.includes(value) ? value : "info";
  }

  #render() {
    const root = this.#root!;
    const status = this.#status();
    const box = this.getAttribute("box");
    const label = this.getAttribute("label");
    root.dataset.status = status;
    root.dataset.box = box === "transparent" || box === "solid" ? box : "tint";
    root.dataset.shape = this.getAttribute("shape") === "round" ? "round" : "rounded";
    if (label) {
      root.setAttribute("role", "img");
      root.setAttribute("aria-label", label);
      root.removeAttribute("aria-hidden");
    } else {
      root.removeAttribute("role");
      root.removeAttribute("aria-label");
      root.setAttribute("aria-hidden", "true");
    }
    if (this.#custom.length) root.replaceChildren(...this.#custom);
    // A fixed glyph string from this package, never consumer input.
    else root.innerHTML = feedbackIcon(status);
  }
}
