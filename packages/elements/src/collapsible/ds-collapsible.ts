import { collapsible as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { localized, onLocaleChange } from "../internal/i18n";
import { disclosureIcon } from "../internal/icons";

/**
 * `<ds-collapsible>` — a single-item disclosure (WAI-ARIA disclosure
 * pattern), ported from the Svelte adapter with identical classes: one
 * trigger button that shows and hides one content region. Behaviour and
 * accessibility come from the headless collapsible in `@design-system/core`.
 *
 * The children are the content. A child with `slot="trigger"` becomes the
 * trigger's content in place of `label`.
 *
 * Attributes: `open`, `disabled`, `label` (the trigger text; "Toggle" by
 * default).
 * Properties: `open`.
 * Regions: `slot="trigger"`.
 * Emits: bubbling `open-change` CustomEvent with `detail.open`.
 */
export class DsCollapsible extends HTMLElementBase {
  static observedAttributes = ["open", "disabled", "label"];

  #root: HTMLDivElement | null = null;
  #trigger: HTMLButtonElement | null = null;
  #label: HTMLSpanElement | null = null;
  #content: HTMLDivElement | null = null;
  #hasTriggerSlot = false;
  #id = core.initialState().id;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#root) this.#sync();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "open");
    if (!this.#root) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  get open(): boolean {
    return boolAttr(this, "open");
  }
  set open(next: boolean) {
    this.toggleAttribute("open", Boolean(next));
  }

  #render() {
    const slotted = new Set<Node>(
      Array.from(this.children).filter((child) => child.getAttribute("slot") === "trigger"),
    );
    for (const child of slotted) (child as Element).removeAttribute("slot");
    this.#hasTriggerSlot = slotted.size > 0;

    const content = document.createElement("div");
    content.className = "collapsible__content";
    content.append(...Array.from(this.childNodes).filter((node) => !slotted.has(node)));

    const root = document.createElement("div");
    root.className = "collapsible";
    const trigger = document.createElement("button");
    trigger.className = "collapsible__trigger";
    const label = document.createElement("span");
    label.className = "collapsible__label";
    const icon = document.createElement("span");
    icon.className = "collapsible__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = disclosureIcon("6 9 12 15 18 9", "var(--ds-collapsible-icon-size, 1.1em)");
    label.append(...slotted);
    trigger.append(label, icon);
    root.append(trigger, content);

    this.#root = root;
    this.#trigger = trigger;
    this.#label = label;
    this.#content = content;
    this.replaceChildren(root);
  }

  #sync() {
    if (!this.#hasTriggerSlot) {
      this.#label!.textContent = localized(this, "label", "collapsible.toggle");
    }

    const api = core.connect({
      state: { open: this.open, disabled: boolAttr(this, "disabled"), id: this.#id },
      setOpen: (next) => {
        if (next === this.open) return;
        this.open = next;
        emit(this, "open-change", { open: next });
      },
    });
    applyProps(this.#root!, api.rootProps);
    applyProps(this.#trigger!, api.triggerProps);
    applyProps(this.#content!, api.contentProps);
  }
}
