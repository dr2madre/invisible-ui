import { button as core } from "@design-system/core";
import { applyProps, boolAttr, HTMLElementBase, upgradeProperty } from "../internal/base";
import { hazardIcon, plusIcon } from "../internal/icons";

/**
 * `<ds-button>` — the styled button as a custom element.
 *
 * Light DOM by design (ADR 0008): the element renders a real `<button>` in
 * the page's tree, so forms, labels and assistive tech see the platform
 * widget, and the shared stylesheet applies with no shadow boundary to
 * pierce. The element's children become the button's label.
 *
 * Attributes: `variant` (default|primary|secondary|ghost|danger), `disabled`,
 * `type` (button|submit|reset), `icon-only`, `left-icon`, `right-icon`,
 * `aria-label` (forwarded — required for icon-only).
 * Activation is the native `click` event.
 */
export class DsButton extends HTMLElementBase {
  static observedAttributes = ["variant", "disabled"];

  #button: HTMLButtonElement | null = null;

  connectedCallback() {
    upgradeProperty(this, "disabled");
    if (!this.#button) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#button) this.#sync();
  }

  get disabled(): boolean {
    return boolAttr(this, "disabled");
  }
  set disabled(value: boolean) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  #render() {
    const iconOnly = boolAttr(this, "icon-only");
    const variant = (this.getAttribute("variant") ?? "default") as core.ButtonVariant;

    const button = document.createElement("button");
    button.className = iconOnly ? "button button--icon-only" : "button";

    // The element's children are the visible label; move them inside.
    const label = document.createDocumentFragment();
    while (this.firstChild) label.appendChild(this.firstChild);

    const showLeft = !iconOnly && (boolAttr(this, "left-icon", variant === "danger") || false);
    if (showLeft) {
      const span = document.createElement("span");
      span.className = "button__icon";
      span.innerHTML = variant === "danger" ? hazardIcon() : plusIcon();
      button.appendChild(span);
    }

    button.appendChild(label);

    if (!iconOnly && boolAttr(this, "right-icon")) {
      const span = document.createElement("span");
      span.className = "button__icon";
      span.innerHTML = plusIcon();
      button.appendChild(span);
    }

    const ariaLabel = this.getAttribute("aria-label");
    if (ariaLabel) {
      button.setAttribute("aria-label", ariaLabel);
      this.removeAttribute("aria-label");
    }

    this.appendChild(button);
    this.#button = button;
  }

  #sync() {
    const api = core.connect({
      state: core.initialState({
        variant: (this.getAttribute("variant") ?? "default") as core.ButtonVariant,
        disabled: this.disabled,
      }),
      type: (this.getAttribute("type") ?? "button") as "button" | "submit" | "reset",
    });
    applyProps(this.#button!, api.rootProps);
  }
}
