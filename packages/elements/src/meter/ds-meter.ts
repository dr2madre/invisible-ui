import { meter } from "@design-system/core";
import { applyProps, HTMLElementBase, nextId, upgradeProperty } from "../internal/base";

const numberAttr = (element: Element, name: string): number | undefined => {
  const raw = element.getAttribute(name);
  if (raw == null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

const NUMBERS = ["value", "min", "max", "low", "high", "optimum"] as const;

/**
 * `<ds-meter>` — a gauge (WAI-ARIA meter pattern), ported from the Svelte
 * adapter with identical classes: a track with a fill that shows a measured
 * value within a known range, such as disk usage or battery. Role,
 * `aria-value*` and the low, medium and high bands come from the headless
 * meter in `@design-system/core`. The fill is coloured by how good the value
 * is, which `optimum` decides. For the completion of a task, use
 * `<ds-progress>`.
 *
 * Attributes: `label` (required: the accessible name), `value` (0 by
 * default), `min` (0 by default), `max` (100 by default), `low` (the upper
 * bound of the low band), `high` (the lower bound of the high band),
 * `optimum` (where the good end of the scale is; `max` by default).
 * Properties: `value`, `min`, `max`, `low`, `high`, `optimum`.
 */
export class DsMeter extends HTMLElementBase {
  static observedAttributes = ["label", "value", "min", "max", "low", "high", "optimum"];

  #id = nextId("ds-meter");
  #root: HTMLDivElement | null = null;
  #fill: HTMLDivElement | null = null;

  connectedCallback() {
    for (const property of NUMBERS) upgradeProperty(this, property);
    if (!this.#root) {
      const root = document.createElement("div");
      root.className = "meter";
      const fill = document.createElement("div");
      fill.className = "meter__indicator";
      root.appendChild(fill);
      this.#root = root;
      this.#fill = fill;
      this.replaceChildren(root);
    }
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#root) this.#render();
  }

  get value(): number {
    return numberAttr(this, "value") ?? 0;
  }
  set value(next: number) {
    this.setAttribute("value", String(next));
  }

  get min(): number {
    return numberAttr(this, "min") ?? 0;
  }
  set min(next: number) {
    this.setAttribute("min", String(next));
  }

  get max(): number {
    return numberAttr(this, "max") ?? 100;
  }
  set max(next: number) {
    this.setAttribute("max", String(next));
  }

  get low(): number | undefined {
    return numberAttr(this, "low");
  }
  set low(next: number | undefined) {
    this.#setOptional("low", next);
  }

  get high(): number | undefined {
    return numberAttr(this, "high");
  }
  set high(next: number | undefined) {
    this.#setOptional("high", next);
  }

  get optimum(): number | undefined {
    return numberAttr(this, "optimum");
  }
  set optimum(next: number | undefined) {
    this.#setOptional("optimum", next);
  }

  #setOptional(name: string, next: number | undefined) {
    if (next == null) this.removeAttribute(name);
    else this.setAttribute(name, String(next));
  }

  #render() {
    const api = meter.connect({
      state: meter.initialState({
        value: this.value,
        min: this.min,
        max: this.max,
        low: this.low,
        high: this.high,
        optimum: this.optimum,
        id: this.#id,
      }),
    });
    applyProps(this.#root!, api.rootProps);
    this.#root!.setAttribute("aria-label", this.getAttribute("label") ?? "");
    applyProps(this.#fill!, api.indicatorProps);
    // The fill is updated in place so its width transition can run.
    this.#fill!.style.inlineSize = `${api.percentage}%`;
  }
}
