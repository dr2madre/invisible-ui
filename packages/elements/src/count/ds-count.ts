import { boolAttr, HTMLElementBase, numberAttr, upgradeProperty } from "../internal/base";

export type CountStatus = "danger" | "neutral" | "info" | "success" | "warning";

/**
 * `<ds-count>` renders a notification count or presence dot.
 *
 * Attributes: `count`, `max`, `dot`, `show-zero`, `status`, `label`.
 * Counts above `max` render as `N+`. Zero is hidden unless `show-zero` is set.
 * A labelled count or dot is announced through one visually hidden live
 * region, created once and updated in place; the visible badge is hidden from
 * assistive technology. An unlabelled dot is decorative.
 */
export class DsCount extends HTMLElementBase {
  static observedAttributes = ["count", "max", "dot", "show-zero", "status", "label"];

  #live: HTMLElement | null = null;

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
    const live = this.#liveRegion();
    for (const child of Array.from(this.childNodes)) if (child !== live) child.remove();
    if (!this.dot && !this.showZero && this.count <= 0) {
      this.#announce("");
      return;
    }

    const root = document.createElement("span");
    root.className = this.dot ? "count count--dot" : "count";
    root.dataset.status = this.#status();
    root.setAttribute("aria-hidden", "true");
    const label = this.getAttribute("label");

    if (this.dot) this.#announce(label ?? "");
    else {
      const display = this.count > this.max ? `${this.max}+` : String(this.count);
      this.#announce(label ?? display);
      root.textContent = display;
    }

    this.appendChild(root);
  }

  #liveRegion() {
    if (!this.#live) {
      const live = document.createElement("span");
      live.className = "count__live";
      live.setAttribute("role", "status");
      live.setAttribute("aria-atomic", "true");
      this.#live = live;
    }
    if (this.#live.parentNode !== this) this.prepend(this.#live);
    return this.#live;
  }

  #announce(text: string) {
    // Unchanged text stays untouched, so unrelated updates are not announced again.
    if (this.#live && this.#live.textContent !== text) this.#live.textContent = text;
  }

  #status(): CountStatus {
    const value = this.getAttribute("status");
    return value === "neutral" || value === "info" || value === "success" || value === "warning"
      ? value
      : "danger";
  }
}
