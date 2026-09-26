import { boolAttr, HTMLElementBase } from "../internal/base";

export type ToggleGroupVariant = "separate" | "segmented";
export type ToggleGroupOrientation = "horizontal" | "vertical";

/**
 * `<ds-toggle-group>` — a visual wrapper that arranges independent
 * `<ds-toggle-button>` children and gives them a shared look.
 *
 * It holds no selection state: each toggle inside is a standalone native
 * checkbox that owns its pressed state, name and form field, and stays its own
 * Tab stop. The children move into a `role="group"` container on first
 * connection.
 *
 * ```html
 * <ds-toggle-group label="Formatting" variant="segmented">
 *   <ds-toggle-button label="Bold">B</ds-toggle-button>
 *   <ds-toggle-button label="Italic">I</ds-toggle-button>
 * </ds-toggle-group>
 * ```
 *
 * `label` names the container for screen readers ("group, Formatting"), not
 * the items; leave it out when the toggles are unrelated.
 *
 * Attributes: `variant` (separate|segmented), `orientation`
 * (horizontal|vertical), `wrap`, `label`.
 */
export class DsToggleGroup extends HTMLElementBase {
  static observedAttributes = ["variant", "orientation", "wrap", "label"];

  #group: HTMLDivElement | null = null;

  connectedCallback() {
    if (!this.#group) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#group) this.#sync();
  }

  #render() {
    const group = document.createElement("div");
    group.setAttribute("role", "group");
    while (this.firstChild) group.appendChild(this.firstChild);
    this.appendChild(group);
    this.#group = group;
  }

  #sync() {
    const group = this.#group!;
    const variant: ToggleGroupVariant =
      this.getAttribute("variant") === "segmented" ? "segmented" : "separate";
    const orientation: ToggleGroupOrientation =
      this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";

    group.className = `toggle-group toggle-group--${variant}`;
    // Wrapping only applies to separate toggles: a segmented group is one control.
    group.classList.toggle("toggle-group--wrap", boolAttr(this, "wrap") && variant === "separate");
    group.dataset.orientation = orientation;
    const label = this.getAttribute("label");
    if (label == null) group.removeAttribute("aria-label");
    else group.setAttribute("aria-label", label);
  }
}
