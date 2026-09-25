import { button as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  HTMLElementBase,
  nextId,
  syncAttribute,
  upgradeProperty,
} from "../internal/base";
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
 * `aria-label` (forwarded — required for icon-only), `aria-haspopup`,
 * `aria-controls`, `title`.
 * Activation is the native `click` event.
 *
 * A child marked `slot="badge"` (a `<ds-count>`, number or dot) sits on the
 * button's corner, outside the `<button>`, so the button keeps its own name
 * and the badge describes it (`aria-describedby`).
 */
export class DsButton extends HTMLElementBase {
  static observedAttributes = [
    "variant",
    "disabled",
    "type",
    "icon-only",
    "left-icon",
    "right-icon",
    "aria-label",
    "aria-haspopup",
    "aria-controls",
    "title",
  ];

  #button: HTMLButtonElement | null = null;
  #leftIcon: HTMLSpanElement | null = null;
  #rightIcon: HTMLSpanElement | null = null;

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
    const button = document.createElement("button");
    button.className = "button";

    // The badge is read before the label moves, so it never lands inside the
    // button: a count inside would join the button's accessible name.
    const badgeContent = Array.from(this.children).filter(
      (child) => child.getAttribute("slot") === "badge",
    );
    for (const child of badgeContent) child.removeAttribute("slot");
    let badge: HTMLSpanElement | null = null;
    if (badgeContent.length > 0) {
      badge = document.createElement("span");
      badge.className = "button__badge";
      badge.id = nextId("ds-button-badge");
      badge.append(...badgeContent);
      button.setAttribute("aria-describedby", badge.id);
      this.classList.add("button__badge-anchor");
    }

    // The element's children are the visible label; move them inside.
    const label = document.createDocumentFragment();
    while (this.firstChild) label.appendChild(this.firstChild);
    button.appendChild(label);

    this.appendChild(button);
    if (badge) this.appendChild(badge);
    this.#button = button;
  }

  #sync() {
    const button = this.#button!;
    const iconOnly = boolAttr(this, "icon-only");
    const variant = (this.getAttribute("variant") ?? "default") as core.ButtonVariant;

    button.classList.toggle("button--icon-only", iconOnly);

    // The icons bracket the label rather than wrapping it, so they are held by
    // reference: the label's own nodes are never touched on a re-sync.
    this.#leftIcon = this.#icon(
      this.#leftIcon,
      !iconOnly && boolAttr(this, "left-icon", variant === "danger"),
      variant === "danger" ? hazardIcon() : plusIcon(),
      (span) => button.insertBefore(span, button.firstChild),
    );
    this.#rightIcon = this.#icon(
      this.#rightIcon,
      !iconOnly && boolAttr(this, "right-icon"),
      plusIcon(),
      (span) => button.appendChild(span),
    );

    // The label moves from the host to the button, so removing it from the host
    // fires this callback again; reading null then means "already moved", not
    // "cleared". Clearing it therefore needs the button, not the host.
    const ariaLabel = this.getAttribute("aria-label");
    if (ariaLabel != null) {
      button.setAttribute("aria-label", ariaLabel);
      this.removeAttribute("aria-label");
    }
    syncAttribute(this, button, "aria-haspopup");
    syncAttribute(this, button, "aria-controls");
    syncAttribute(this, button, "title");

    const api = core.connect({
      state: core.initialState({ variant, disabled: this.disabled }),
      type: (this.getAttribute("type") ?? "button") as "button" | "submit" | "reset",
    });
    applyProps(button, api.rootProps);
  }

  #icon(
    current: HTMLSpanElement | null,
    show: boolean,
    glyph: string,
    place: (span: HTMLSpanElement) => void,
  ): HTMLSpanElement | null {
    if (!show) {
      current?.remove();
      return null;
    }
    const span = current ?? document.createElement("span");
    span.className = "button__icon";
    if (span.innerHTML !== glyph) span.innerHTML = glyph;
    if (!current) place(span);
    return span;
  }
}
