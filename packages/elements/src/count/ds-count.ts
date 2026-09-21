import { boolAttr, HTMLElementBase, upgradeProperty } from "../internal/base";

export type CountStatus = "danger" | "neutral" | "info" | "success" | "warning";

const numberAttr = (element: Element, name: string, fallback: number) => {
  const raw = element.getAttribute(name);
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

/**
 * `<ds-count>` renders a notification count or presence dot.
 *
 * Attributes: `count`, `max`, `dot`, `show-zero`, `status`, `label`.
 * Counts above `max` render as `N+`. Zero is hidden unless `show-zero` is set.
 * A labelled count or dot exposes a status name; an unlabelled dot is
 * decorative.
 */
export class DsCount extends HTMLElementBase {
  static observedAttributes = ["count", "max", "dot", "show-zero", "status", "label"];

  connectedCallback() {
    for (const property of ["count", "max", "dot", "showZero"]) upgradeProperty(this, property);
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  get count(): number {
    return numberAttr(this, "count", 0);
  }
  set count(value: number) {
    this.setAttribute("count", String(value));
  }

  get max(): number {
    return numberAttr(this, "max", 99);
  }
  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  get dot(): boolean {
    return boolAttr(this, "dot");
  }
  set dot(value: boolean) {
    if (value) this.setAttribute("dot", "");
    else this.removeAttribute("dot");
  }

  get showZero(): boolean {
    return boolAttr(this, "show-zero");
  }
  set showZero(value: boolean) {
    if (value) this.setAttribute("show-zero", "");
    else this.removeAttribute("show-zero");
  }

  #render() {
    this.textContent = "";
    if (!this.dot && !this.showZero && this.count <= 0) return;

    const root = document.createElement("span");
    root.className = this.dot ? "count count--dot" : "count";
    root.dataset.status = this.#status();
    const label = this.getAttribute("label");

    if (this.dot) {
      if (label) {
        root.setAttribute("role", "status");
        root.setAttribute("aria-label", label);
      } else {
        root.setAttribute("aria-hidden", "true");
      }
    } else {
      const display = this.count > this.max ? `${this.max}+` : String(this.count);
      root.setAttribute("role", "status");
      root.setAttribute("aria-label", label ?? display);
      const visible = document.createElement("span");
      visible.setAttribute("aria-hidden", "true");
      visible.textContent = display;
      root.appendChild(visible);
    }

    this.appendChild(root);
  }

  #status(): CountStatus {
    const value = this.getAttribute("status");
    return value === "neutral" || value === "info" || value === "success" || value === "warning"
      ? value
      : "danger";
  }
}
