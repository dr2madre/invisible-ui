import { progress } from "@design-system/core";
import { applyProps, boolAttr, HTMLElementBase, nextId, upgradeProperty } from "../internal/base";

export type ProgressShape = "bar" | "circle";

const SVG_NS = "http://www.w3.org/2000/svg";
// r=15.9155 makes the circumference 100, so dasharray maps 1:1 to percent.
const R = "15.9155";

const numberAttr = (element: Element, name: string, fallback: number) => {
  const raw = element.getAttribute(name);
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

/**
 * `<ds-progress>` — a determinate progress bar (WAI-ARIA progressbar pattern),
 * ported from the Svelte adapter with identical classes: a track with a fill
 * that shows a value against a range. Role and `aria-value*` come from the
 * headless progress in `@design-system/core`.
 *
 * There is no indeterminate state: waiting without a value is the job of
 * `<ds-loading>`. The `label` gives the bar its accessible name.
 *
 * Attributes: `label` (required: the accessible name), `value` (the current
 * value; 0 by default), `min` (the range start; 0 by default), `max` (the
 * range end; 100 by default), `shape` (bar|circle), `show-value` (the
 * percentage inside the circle).
 * Properties: `value`, `min`, `max`.
 */
export class DsProgress extends HTMLElementBase {
  static observedAttributes = ["value", "min", "max", "shape", "show-value", "label"];

  #id = nextId("ds-progress");
  #root: HTMLDivElement | null = null;
  #fill: HTMLElement | SVGElement | null = null;
  #shape: ProgressShape | null = null;

  connectedCallback() {
    for (const property of ["value", "min", "max"]) upgradeProperty(this, property);
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  get value(): number {
    return numberAttr(this, "value", 0);
  }
  set value(next: number) {
    this.setAttribute("value", String(next));
  }

  get min(): number {
    return numberAttr(this, "min", 0);
  }
  set min(next: number) {
    this.setAttribute("min", String(next));
  }

  get max(): number {
    return numberAttr(this, "max", 100);
  }
  set max(next: number) {
    this.setAttribute("max", String(next));
  }

  #render() {
    const api = progress.connect({
      state: progress.initialState({
        value: this.value,
        min: this.min,
        max: this.max,
        id: this.#id,
      }),
    });
    const pct = api.percentage ?? 0;
    const shape: ProgressShape = this.getAttribute("shape") === "circle" ? "circle" : "bar";

    // The fill is updated in place so its width transition can run.
    if (!this.#root || this.#shape !== shape) this.#build(shape);
    const root = this.#root!;
    applyProps(root, api.rootProps);
    root.setAttribute("aria-label", this.getAttribute("label") ?? "");
    applyProps(this.#fill!, api.indicatorProps);

    if (shape === "circle") {
      this.#fill!.style.strokeDasharray = `${pct} 100`;
      const showValue = boolAttr(this, "show-value");
      let value = root.querySelector<HTMLElement>(".progress__value");
      if (showValue && !value) {
        value = document.createElement("span");
        value.className = "progress__value";
        root.appendChild(value);
      } else if (!showValue) value?.remove();
      if (showValue) value!.textContent = `${Math.round(pct)}%`;
    } else {
      this.#fill!.style.inlineSize = `${pct}%`;
    }
  }

  #build(shape: ProgressShape) {
    const root = document.createElement("div");
    root.className = shape === "circle" ? "progress progress--circle" : "progress";
    if (shape === "circle") {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 36 36");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      const ring = this.#circle("progress__ring");
      svg.append(this.#circle("progress__track"), ring);
      root.appendChild(svg);
      this.#fill = ring;
    } else {
      const indicator = document.createElement("div");
      indicator.className = "progress__indicator";
      root.appendChild(indicator);
      this.#fill = indicator;
    }
    this.#root = root;
    this.#shape = shape;
    this.replaceChildren(root);
  }

  #circle(className: string) {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("class", className);
    circle.setAttribute("cx", "18");
    circle.setAttribute("cy", "18");
    circle.setAttribute("r", R);
    return circle;
  }
}
