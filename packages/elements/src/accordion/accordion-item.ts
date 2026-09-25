import { HTMLElementBase } from "../internal/base";
import { disclosureIcon } from "../internal/icons";

/** What an item needs from the `<ds-accordion>` that contains it. */
interface ItemsOwner extends Element {
  syncItems(): void;
}

const ownerOf = (item: Element): ItemsOwner | null => {
  const owner = item.parentElement?.closest("ds-accordion") ?? null;
  return owner && typeof (owner as Partial<ItemsOwner>).syncItems === "function"
    ? (owner as ItemsOwner)
    : null;
};

/**
 * `<ds-accordion-item>` — one item of a `<ds-accordion>`: a header button
 * and the panel it shows. Its children are the panel content, so the panel
 * can hold any markup.
 *
 * Attributes: `value` (required), `label` (the header text; the value by
 * default), `disabled`.
 */
export class DsAccordionItem extends HTMLElementBase {
  static observedAttributes = ["value", "label", "disabled"];

  #owner: ItemsOwner | null = null;
  #label: HTMLSpanElement | null = null;
  #trigger: HTMLButtonElement | null = null;
  #panel: HTMLDivElement | null = null;

  /** The header button, once the item has rendered. */
  get trigger(): HTMLButtonElement | null {
    return this.#trigger;
  }

  /** The panel, once the item has rendered. */
  get panel(): HTMLDivElement | null {
    return this.#panel;
  }

  connectedCallback() {
    if (!this.#trigger) this.#render();
    this.#owner = ownerOf(this);
    this.#owner?.syncItems();
  }

  disconnectedCallback() {
    const owner = this.#owner;
    this.#owner = null;
    owner?.syncItems();
  }

  attributeChangedCallback() {
    if (!this.#trigger) return;
    this.#syncLabel();
    this.#owner?.syncItems();
  }

  #render() {
    this.classList.add("accordion__item");
    const panel = document.createElement("div");
    panel.className = "accordion__panel";
    panel.append(...Array.from(this.childNodes));

    const heading = document.createElement("h3");
    heading.className = "accordion__heading";
    const trigger = document.createElement("button");
    trigger.className = "accordion__trigger";
    const label = document.createElement("span");
    const icon = document.createElement("span");
    icon.className = "accordion__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = disclosureIcon("9 6 15 12 9 18", "var(--ds-accordion-icon-size, 1.1em)");
    trigger.append(label, icon);
    heading.appendChild(trigger);

    this.#label = label;
    this.#trigger = trigger;
    this.#panel = panel;
    this.#syncLabel();
    this.append(heading, panel);
  }

  #syncLabel() {
    this.#label!.textContent = this.getAttribute("label") ?? this.getAttribute("value") ?? "";
  }
}
