import { buttonGroup as core } from "@design-system/core";
import { applyProps, boolAttr, HTMLElementBase, upgradeProperty } from "../internal/base";

export type ButtonGroupOrientation = core.Orientation;
export type ButtonGroupAlign = "start" | "center" | "end" | "stretch";

const ALIGN_ITEMS: Record<ButtonGroupAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

/**
 * `<ds-button-group>` groups related action buttons in a labelled
 * `role="group"`. Its children (`<ds-button>`s or any `<button>`) are moved
 * into the group once at render; the stylesheet targets them as direct
 * children of the group.
 *
 * The group holds no selection: each button stays an independent action and
 * an independent tab stop. `attached` (on unless set to `"false"`) joins the
 * buttons into one bar; `align` sets the cross-axis alignment (default
 * `center`, so a taller sibling keeps the buttons at their own height).
 *
 * Attributes: `label` (required), `orientation` (horizontal|vertical),
 * `attached`, `align` (start|center|end|stretch).
 */
export class DsButtonGroup extends HTMLElementBase {
  static observedAttributes = ["label", "orientation", "attached", "align"];

  #root: HTMLDivElement | null = null;

  connectedCallback() {
    upgradeProperty(this, "attached");
    if (!this.#root) {
      const root = document.createElement("div");
      while (this.firstChild) root.appendChild(this.firstChild);
      this.appendChild(root);
      this.#root = root;
    }
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  get attached(): boolean {
    return boolAttr(this, "attached", true);
  }
  set attached(value: boolean) {
    this.setAttribute("attached", value ? "" : "false");
  }

  #sync() {
    const root = this.#root!;
    const orientation: ButtonGroupOrientation =
      this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
    const align = (this.getAttribute("align") ?? "center") as ButtonGroupAlign;

    root.className = "button-group";
    root.classList.toggle("button-group--attached", this.attached);
    root.classList.toggle("button-group--vertical", orientation === "vertical");
    // The shared sheet leaves alignment to the adapter, as the Vue port does.
    root.style.alignItems = ALIGN_ITEMS[align] ?? ALIGN_ITEMS.center;

    const api = core.connect({
      state: core.initialState({ label: this.getAttribute("label") ?? undefined, orientation }),
    });
    applyProps(root, api.groupProps);
  }
}
