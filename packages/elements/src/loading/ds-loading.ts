import { boolAttr, HTMLElementBase } from "../internal/base";
import { localized, onLocaleChange } from "../internal/i18n";

export type LoadingVariant = "dots" | "spinner" | "bar" | "typing" | "morph";

/**
 * `<ds-loading>` presents inline indeterminate or determinate progress.
 *
 * Attributes: `variant`, `value`, `label`, `show-label`, `show-value`,
 * `detail`, `decorative`, `status`, `delay`, `overlay`, `veil`.
 */
export class DsLoading extends HTMLElementBase {
  static observedAttributes = [
    "variant",
    "value",
    "label",
    "show-label",
    "show-value",
    "detail",
    "decorative",
    "status",
    "delay",
    "overlay",
    "veil",
  ];

  #visible = false;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.isConnected && this.#visible) this.#render();
    });
  }

  connectedCallback() {
    this.#schedule();
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  attributeChangedCallback(name: string) {
    if (!this.isConnected) return;
    if (name === "delay") this.#schedule();
    else if (this.#visible) this.#render();
  }

  #schedule() {
    clearTimeout(this.#timer);
    this.#timer = undefined;
    const delay = this.#delay();
    this.#visible = delay <= 0;
    this.#render();
    if (delay > 0) {
      this.#timer = setTimeout(() => {
        this.#timer = undefined;
        if (!this.isConnected) return;
        this.#visible = true;
        this.#render();
      }, delay);
    }
  }

  #render() {
    this.textContent = "";
    if (!this.#visible) return;

    const variant = this.#variant();
    const value = this.#value();
    const determinate = variant === "bar" && value != null;
    const decorative = boolAttr(this, "decorative");
    const status = this.getAttribute("status");
    const label = localized(this, "label", "loading.label");
    const detail = this.getAttribute("detail");

    const root = document.createElement("span");
    root.className = "loading";
    if (boolAttr(this, "overlay")) {
      root.classList.add("loading--overlay");
      if (boolAttr(this, "veil", true)) root.classList.add("loading--veil");
    }
    root.dataset.variant = variant;

    if (decorative) root.setAttribute("aria-hidden", "true");
    else if (determinate) {
      root.setAttribute("role", "progressbar");
      root.setAttribute("aria-label", label);
      root.setAttribute("aria-valuemin", "0");
      root.setAttribute("aria-valuemax", "100");
      root.setAttribute("aria-valuenow", String(value));
      if (detail ?? status) root.setAttribute("aria-valuetext", detail ?? status!);
    } else {
      root.setAttribute("role", "status");
      if (status == null) root.setAttribute("aria-label", label);
      else root.setAttribute("aria-atomic", "true");
    }

    root.appendChild(variant === "bar" ? this.#bar(value) : this.#indicator(variant));

    if (status != null) {
      const message = document.createElement("span");
      message.className = "loading__status";
      message.textContent = status;
      root.appendChild(message);
    }

    const showLabel = boolAttr(this, "show-label");
    const showValue = boolAttr(this, "show-value") && value != null;
    if (showLabel || showValue || detail != null) {
      const visibleLabel = document.createElement("span");
      visibleLabel.className = "loading__label";
      visibleLabel.setAttribute("aria-hidden", "true");
      if (showLabel) visibleLabel.appendChild(this.#text(label));
      if (showValue) visibleLabel.appendChild(this.#meta(`${Math.round(value!)}%`));
      if (detail != null) visibleLabel.appendChild(this.#meta(detail));
      root.appendChild(visibleLabel);
    }

    this.appendChild(root);
  }

  #indicator(variant: LoadingVariant) {
    const indicator = document.createElement("span");
    indicator.className = "loading__indicator";
    if (variant === "spinner") {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "loading__spinner");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2.5");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M21 12a9 9 0 1 1-6.2-8.56");
      svg.appendChild(path);
      indicator.appendChild(svg);
    } else if (variant === "morph") {
      const shape = document.createElement("span");
      shape.className = "loading__shape";
      indicator.appendChild(shape);
    } else {
      for (let index = 0; index < 3; index += 1) {
        const dot = document.createElement("span");
        dot.className = "loading__dot";
        indicator.appendChild(dot);
      }
    }
    return indicator;
  }

  #bar(value: number | null) {
    const track = document.createElement("span");
    track.className = "loading__track";
    const fill = document.createElement("span");
    if (value == null) fill.className = "loading__segment";
    else {
      fill.className = "loading__fill";
      fill.style.inlineSize = `${value}%`;
    }
    track.appendChild(fill);
    return track;
  }

  #text(value: string) {
    const text = document.createElement("span");
    text.textContent = value;
    return text;
  }

  #meta(value: string) {
    const text = this.#text(value);
    text.className = "loading__meta";
    return text;
  }

  #variant(): LoadingVariant {
    const variant = this.getAttribute("variant");
    return variant === "spinner" || variant === "bar" || variant === "typing" || variant === "morph"
      ? variant
      : "dots";
  }

  #value() {
    if (!this.hasAttribute("value")) return null;
    const value = Number(this.getAttribute("value"));
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
  }

  #delay() {
    const delay = Number(this.getAttribute("delay") ?? 0);
    return Number.isFinite(delay) ? Math.max(0, delay) : 0;
  }
}
