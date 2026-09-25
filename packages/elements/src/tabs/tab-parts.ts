import { HTMLElementBase } from "../internal/base";

/** What a part needs from the `<ds-tabs>` that contains it. */
interface PartsOwner extends Element {
  syncParts(): void;
}

const ownerOf = (part: Element): PartsOwner | null => {
  const owner = part.parentElement?.closest("ds-tabs") ?? null;
  return owner && typeof (owner as Partial<PartsOwner>).syncParts === "function"
    ? (owner as PartsOwner)
    : null;
};

/**
 * Shared behaviour of the tab parts: each one tells the `<ds-tabs>` that
 * contains it when it arrives, leaves or changes, and the tabs re-wire every
 * part. A part written before its tabs upgrade waits: the tabs look for their
 * parts when they connect.
 */
abstract class TabPart extends HTMLElementBase {
  protected abstract readonly partClass: string;
  #owner: PartsOwner | null = null;

  connectedCallback() {
    this.classList.add(this.partClass);
    this.#owner = ownerOf(this);
    this.#owner?.syncParts();
  }

  disconnectedCallback() {
    const owner = this.#owner;
    this.#owner = null;
    owner?.syncParts();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#owner?.syncParts();
  }
}

/**
 * `<ds-tab-list>` — the tab strip of a `<ds-tabs>`, placed anywhere inside it
 * (in a header, beside other controls). It holds the `<ds-tab>` elements.
 *
 * Attributes: `label` (required: the tablist's accessible name).
 */
export class DsTabList extends TabPart {
  static observedAttributes = ["label"];
  protected readonly partClass = "tabs__list";
}

/**
 * `<ds-tab>` — one tab of a `<ds-tab-list>`. Its children are its content:
 * text, an icon, a `<ds-count>`.
 *
 * Attributes: `value` (required), `disabled`.
 */
export class DsTab extends TabPart {
  static observedAttributes = ["value", "disabled"];
  protected readonly partClass = "tabs__tab";
}

/**
 * `<ds-tab-panel>` — the panel of the tab with the same `value`, placed
 * anywhere inside the `<ds-tabs>`. Its children are the panel content.
 *
 * Attributes: `value` (required).
 */
export class DsTabPanel extends TabPart {
  static observedAttributes = ["value"];
  protected readonly partClass = "tabs__panel";
}
