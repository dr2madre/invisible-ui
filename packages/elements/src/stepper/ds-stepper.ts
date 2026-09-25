import { stepper as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { localized, onLocaleChange } from "../internal/i18n";

/** A step's display content. */
export interface StepDescriptor {
  /** Short title. */
  label: string;
  /** Optional secondary line. */
  description?: string;
}

export type StepperOrientation = core.Orientation;

const SVG_NS = "http://www.w3.org/2000/svg";

/** The check drawn on a completed step's indicator. */
const checkGlyph = () => {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "1em");
  svg.setAttribute("height", "1em");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M3.5 8.5l3 3 6-6.5");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.75");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);
  return svg;
};

interface StepNodes {
  item: HTMLLIElement;
  trigger: HTMLButtonElement;
  indicator: HTMLSpanElement;
  text: HTMLSpanElement;
}

/**
 * `<ds-stepper>` — an ordered sequence of steps showing what is complete,
 * current and upcoming, ported from the Svelte adapter with the Vue DOM.
 * Behaviour (status, linear gating) comes from the core stepper; the markup is
 * a labelled `<nav>` around an `<ol>`, the current step marked
 * `aria-current="step"`. A completed step shows a decorative check and adds a
 * visually hidden status after its label, so its name reads "label, status,
 * description".
 *
 * In linear mode (default) the steps ahead of the current one are disabled;
 * `linear="false"` allows any step. Labels wrap and are never cut; in a narrow
 * container the horizontal row becomes the vertical presentation, with the
 * same DOM and focus order. Step labels and descriptions are always text.
 *
 * Attributes: `current` (0-based step, `0` by default), `linear` (on by
 * default, `"false"` turns it off), `orientation` (`horizontal` or
 * `vertical`), `disabled`, `label` (the landmark name), `completed-label`
 * (the status read for a completed step).
 * Properties: `steps` (each with a `label` and an optional `description`),
 * `current`.
 * Emits: `change` (`detail.current`) after the user picks a step.
 */
export class DsStepper extends HTMLElementBase {
  static observedAttributes = [
    "current",
    "linear",
    "orientation",
    "disabled",
    "label",
    "completed-label",
  ];

  #steps: StepDescriptor[] = [];
  #current = 0;
  #nav: HTMLElement | null = null;
  #list: HTMLOListElement | null = null;
  #nodes: StepNodes[] = [];
  #id = core.initialState({ count: 0 }).id;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#nav) this.#sync();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "steps");
    upgradeProperty(this, "current");
    this.#current = this.#currentAttr();
    if (!this.#nav) {
      this.#nav = document.createElement("nav");
      this.#nav.className = "stepper";
      this.#list = document.createElement("ol");
      this.#list.className = "stepper__list";
      this.#nav.appendChild(this.#list);
      this.replaceChildren(this.#nav);
    }
    this.#sync();
  }

  attributeChangedCallback(name: string) {
    if (!this.#nav) return;
    if (name === "current") this.#current = this.#currentAttr();
    this.#sync();
  }

  get steps(): StepDescriptor[] {
    return this.#steps;
  }
  set steps(value: StepDescriptor[]) {
    this.#steps = Array.isArray(value) ? value : [];
    if (this.#nav) {
      this.#current = this.#currentAttr();
      this.#sync();
    }
  }

  get current(): number {
    return this.#nav ? this.#current : this.#currentAttr();
  }
  set current(value: number) {
    this.setAttribute("current", String(value));
  }

  #currentAttr() {
    const value = Number(this.getAttribute("current") ?? 0);
    return core.clampStep(Number.isFinite(value) ? Math.trunc(value) : 0, this.#steps.length);
  }

  #api() {
    const state: core.StepperState = {
      count: this.#steps.length,
      current: this.#current,
      linear: boolAttr(this, "linear", true),
      orientation: this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal",
      disabled: boolAttr(this, "disabled"),
      id: this.#id,
    };
    return core.connect({
      state,
      setStep: (next) => {
        if (next === this.#current) return;
        this.#current = next;
        this.setAttribute("current", String(next));
        emit(this, "change", { current: next });
      },
    });
  }

  #sync() {
    const api = this.#api();
    applyProps(this.#nav!, api.rootProps);
    this.#nav!.setAttribute("aria-label", localized(this, "label", "stepper.label"));
    applyProps(this.#list!, api.getListProps());
    const completed = localized(this, "completed-label", "stepper.completed");

    // Nodes are kept per index, so the step that holds focus keeps it.
    while (this.#nodes.length > this.#steps.length) this.#nodes.pop()!.item.remove();
    this.#steps.forEach((step, index) => {
      let nodes = this.#nodes[index];
      if (!nodes) {
        nodes = this.#createStep(index);
        this.#nodes.push(nodes);
        this.#list!.appendChild(nodes.item);
      }
      const status = api.status(index);
      nodes.item.dataset.status = status;
      applyProps(nodes.trigger, api.getStepProps(index));

      if (status === "complete") {
        if (!nodes.indicator.querySelector("svg")) nodes.indicator.replaceChildren(checkGlyph());
      } else nodes.indicator.textContent = String(index + 1);

      const label = document.createElement("span");
      label.className = "stepper__label";
      label.textContent = step.label;
      const parts: (Node | string)[] = [label];
      // Spaces keep the parts apart in the accessible name. The status comes
      // after the label; the checkmark is decorative and says nothing.
      if (status === "complete") {
        const state = document.createElement("span");
        state.className = "stepper__status";
        state.textContent = completed;
        parts.push(" ", state);
      }
      if (step.description) {
        const description = document.createElement("span");
        description.className = "stepper__description";
        description.textContent = step.description;
        parts.push(" ", description);
      }
      nodes.text.replaceChildren(...parts);
    });
  }

  #createStep(index: number): StepNodes {
    const item = document.createElement("li");
    item.className = "stepper__step";
    if (index > 0) {
      const connector = document.createElement("span");
      connector.className = "stepper__connector";
      connector.setAttribute("aria-hidden", "true");
      item.appendChild(connector);
    }
    const trigger = document.createElement("button");
    trigger.className = "stepper__trigger";
    const indicator = document.createElement("span");
    indicator.className = "stepper__indicator";
    indicator.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.className = "stepper__text";
    trigger.append(indicator, text);
    item.appendChild(trigger);
    return { item, trigger, indicator, text };
  }
}
