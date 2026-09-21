import { boolAttr, HTMLElementBase } from "../internal/base";

export type LoadingGenerationAreaPosition = "center" | "top" | "bottom" | "left" | "right";

type Region = "default" | "indicator";

/**
 * `<ds-loading-generation-area>` replaces a bounded surface with a loading
 * presentation, then restores its light-DOM content when `loading="false"`.
 *
 * Attributes: `label`, `decorative`, `loading`, `field`, `label-position`,
 * `status`, `value`, `detail`.
 * Regions: children marked `slot="indicator"` replace the dot field's
 * indicator; unslotted children are the completed content.
 */
export class DsLoadingGenerationArea extends HTMLElementBase {
  static observedAttributes = [
    "label",
    "decorative",
    "loading",
    "field",
    "label-position",
    "status",
    "value",
    "detail",
  ];

  #regions = new Map<Region, Node[]>();
  #captured = false;

  connectedCallback() {
    if (!this.#captured) this.#capture();
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#captured && this.isConnected) this.#render();
  }

  #capture() {
    for (const node of Array.from(this.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
        node.remove();
        continue;
      }
      const region: Region =
        node instanceof Element && node.getAttribute("slot") === "indicator"
          ? "indicator"
          : "default";
      if (node instanceof Element && region === "indicator") node.removeAttribute("slot");
      const nodes = this.#regions.get(region) ?? [];
      nodes.push(node);
      this.#regions.set(region, nodes);
    }
    this.#captured = true;
  }

  #render() {
    this.textContent = "";
    if (!boolAttr(this, "loading", true)) {
      const content = document.createElement("div");
      content.className = "loading-generation-area__content";
      content.append(...(this.#regions.get("default") ?? []));
      this.appendChild(content);
      return;
    }

    const root = document.createElement("div");
    root.className = "loading-generation-area";
    if (boolAttr(this, "field", true)) root.classList.add("loading-generation-area--field");
    root.dataset.position = this.#position();

    const decorative = boolAttr(this, "decorative");
    const status = this.getAttribute("status");
    if (decorative) root.setAttribute("aria-hidden", "true");
    else {
      root.setAttribute("role", "status");
      if (status == null) root.setAttribute("aria-label", this.getAttribute("label") ?? "Loading…");
      else root.setAttribute("aria-atomic", "true");
    }

    const indicator = this.#regions.get("indicator");
    const value = this.#value();
    const detail = this.getAttribute("detail");
    if (indicator?.length || status != null || value != null || detail != null) {
      const zone = document.createElement("div");
      zone.className = "loading-generation-area__zone";
      if (indicator?.length) zone.append(...indicator);
      if (status != null) zone.appendChild(this.#text("status", status));
      if (value != null) zone.appendChild(this.#text("value", `${Math.round(value)}%`, true));
      if (detail != null) zone.appendChild(this.#text("detail", detail, true));
      root.appendChild(zone);
    }

    this.appendChild(root);
  }

  #text(part: "status" | "value" | "detail", value: string, hidden = false) {
    const element = document.createElement("span");
    element.className = `loading-generation-area__${part}`;
    element.textContent = value;
    if (hidden) element.setAttribute("aria-hidden", "true");
    return element;
  }

  #position(): LoadingGenerationAreaPosition {
    const position = this.getAttribute("label-position");
    return position === "top" ||
      position === "bottom" ||
      position === "left" ||
      position === "right"
      ? position
      : "center";
  }

  #value() {
    if (!this.hasAttribute("value")) return null;
    const value = Number(this.getAttribute("value"));
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
  }
}
