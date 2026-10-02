import { boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { closeIcon } from "../internal/icons";
import { localized, onLocaleChange } from "../internal/i18n";

export type TagStatus = "neutral" | "info" | "success" | "warning" | "danger" | "selected";

/**
 * `<ds-tag>` renders a status chip. Its unslotted children are the visible
 * label; children marked `slot="icon"` or `slot="trailing"` fill those regions.
 * The nodes remain in light DOM.
 *
 * Attributes: `status`, `variant` (`soft` or `solid`), `size` (`sm` or `md`),
 * `removable`, `remove-label`, `label`.
 * Emits: `remove` after the remove button is activated. The element does not
 * remove itself.
 */
export class DsTag extends HTMLElementBase {
  static observedAttributes = ["status", "variant", "size", "removable", "remove-label", "label"];

  #root: HTMLSpanElement | null = null;
  #label: HTMLSpanElement | null = null;
  #remove: HTMLButtonElement | null = null;
  #labelNodes: Node[] = [];

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#root) this.#sync();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "removable");
    if (!this.#root) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  get removable(): boolean {
    return boolAttr(this, "removable");
  }
  set removable(value: boolean) {
    if (value) this.setAttribute("removable", "");
    else this.removeAttribute("removable");
  }

  #render() {
    const children = Array.from(this.childNodes);
    const iconNodes = children.filter(
      (node) => node instanceof Element && node.getAttribute("slot") === "icon",
    );
    const trailingNodes = children.filter(
      (node) => node instanceof Element && node.getAttribute("slot") === "trailing",
    );
    const claimed = new Set([...iconNodes, ...trailingNodes]);
    const labelNodes = children.filter((node) => !claimed.has(node));
    this.#labelNodes = labelNodes;

    this.textContent = "";
    const root = document.createElement("span");
    root.className = "tag";
    if (iconNodes.length) {
      const icon = document.createElement("span");
      icon.className = "tag__icon";
      icon.setAttribute("aria-hidden", "true");
      for (const node of iconNodes) {
        if (node instanceof Element) node.removeAttribute("slot");
        icon.appendChild(node);
      }
      root.appendChild(icon);
    }

    const label = document.createElement("span");
    label.className = "tag__label";
    label.append(...labelNodes);
    root.appendChild(label);

    if (trailingNodes.length) {
      const trailing = document.createElement("span");
      trailing.className = "tag__trailing";
      for (const node of trailingNodes) {
        if (node instanceof Element) node.removeAttribute("slot");
        trailing.appendChild(node);
      }
      root.appendChild(trailing);
    }

    this.appendChild(root);
    this.#root = root;
    this.#label = label;
  }

  #sync() {
    const status = this.#status();
    this.#root!.dataset.status = status;
    this.#root!.dataset.variant = this.getAttribute("variant") === "solid" ? "solid" : "soft";
    this.#root!.dataset.size = this.getAttribute("size") === "sm" ? "sm" : "md";

    const explicitLabel = this.getAttribute("label");
    this.#label!.textContent = "";
    if (explicitLabel != null) this.#label!.textContent = explicitLabel;
    else this.#label!.append(...this.#labelNodes);

    if (this.removable && !this.#remove) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tag__remove";
      button.innerHTML = closeIcon();
      button.addEventListener("click", () => emit(this, "remove"));
      this.#root!.appendChild(button);
      this.#remove = button;
    } else if (!this.removable && this.#remove) {
      this.#remove.remove();
      this.#remove = null;
    }
    this.#remove?.setAttribute("aria-label", localized(this, "remove-label", "tag.remove"));
  }

  #status(): TagStatus {
    const status = this.getAttribute("status");
    return status === "info" ||
      status === "success" ||
      status === "warning" ||
      status === "danger" ||
      status === "selected"
      ? status
      : "neutral";
  }
}
