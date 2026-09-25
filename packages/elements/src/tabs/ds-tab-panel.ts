import { HTMLElementBase } from "../internal/base";

/** What a panel needs from the tabs it belongs to. */
interface PanelOwner extends Element {
  syncPanels(): void;
}

const isOwner = (node: Element | null): node is PanelOwner =>
  node != null && typeof (node as Partial<PanelOwner>).syncPanels === "function";

/**
 * `<ds-tab-panel>` — a tab panel that lives outside its `<ds-tabs>`, so the
 * tab strip can sit in a header and the panels anywhere else on the page.
 *
 * Attributes: `for` (required: the `id` of the `<ds-tabs>` it belongs to),
 * `value` (required: the value of the tab it belongs to). Its children are the
 * panel content. The owning tabs set `role="tabpanel"`, the id, the
 * `aria-labelledby` link to the tab and `hidden` on the element itself; once a
 * `<ds-tabs>` has any external panel, it renders none of its own.
 */
export class DsTabPanel extends HTMLElementBase {
  static observedAttributes = ["for", "value"];

  #owner: PanelOwner | null = null;

  connectedCallback() {
    this.classList.add("tabs__panel");
    this.#resync();
  }

  disconnectedCallback() {
    // The tabs it left may have to render their own panels again.
    const owner = this.#owner;
    this.#owner = null;
    owner?.syncPanels();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#resync();
  }

  #resync() {
    const previous = this.#owner;
    const id = this.getAttribute("for");
    const root = this.getRootNode() as Document | ShadowRoot;
    const found = id ? (root.getElementById?.(id) ?? null) : null;
    this.#owner = isOwner(found) ? found : null;
    if (previous && previous !== this.#owner) previous.syncPanels();
    // A panel written before its tabs waits: the tabs look for their panels
    // when they connect.
    this.#owner?.syncPanels();
  }
}
