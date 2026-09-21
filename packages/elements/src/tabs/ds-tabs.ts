import { tabs as core } from "@design-system/core";
import { applyProps, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { pathIcon } from "../internal/icons";

export type TabsActivationMode = core.ActivationMode;

export type TabsItem = core.TabItem & {
  label?: string;
  content?: string;
  count?: number;
  icon?: string;
  iconOnly?: boolean;
};

export type TabsPanelContent = Node | string | number | null | undefined;

/**
 * `<ds-tabs>` renders the WAI-ARIA tabs pattern through the shared core state
 * machine. Assign `items` as a JavaScript property.
 *
 * Attributes: `label` (required), `value`, `activation-mode`
 * (automatic|manual). Properties: `items`, `renderPanel`. `renderPanel` may
 * return a DOM Node or scalar; strings are inserted as text. Emits a bubbling
 * `change` event with `detail.value` when the selected tab changes.
 */
export class DsTabs extends HTMLElementBase {
  static observedAttributes = ["label", "value", "activation-mode"];

  #items: TabsItem[] = [];
  #renderPanel: ((item: TabsItem) => TabsPanelContent) | null = null;
  #value: string | null = null;
  #root: HTMLDivElement | null = null;
  #list: HTMLDivElement | null = null;
  #tabs = new Map<string, HTMLButtonElement>();
  #panels = new Map<string, HTMLDivElement>();
  #id = core.initialState({ items: [] }).id;

  connectedCallback() {
    upgradeProperty(this, "items");
    upgradeProperty(this, "value");
    upgradeProperty(this, "renderPanel");
    if (!this.#root) this.#render();
    this.#syncFromAttributes();
  }

  attributeChangedCallback() {
    if (this.#root) this.#syncFromAttributes();
  }

  get items(): TabsItem[] {
    return this.#items;
  }
  set items(value: TabsItem[]) {
    this.#items = Array.isArray(value) ? value : [];
    if (!this.#root) return;
    this.#renderItems();
    this.#syncFromAttributes();
  }

  get renderPanel(): ((item: TabsItem) => TabsPanelContent) | null {
    return this.#renderPanel;
  }
  set renderPanel(value: ((item: TabsItem) => TabsPanelContent) | null) {
    this.#renderPanel = typeof value === "function" ? value : null;
    if (!this.#root) return;
    this.#renderItems();
    this.#syncFromAttributes();
  }

  get value(): string | null {
    return this.#root ? this.#value : this.getAttribute("value");
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  #render() {
    this.textContent = "";
    const root = document.createElement("div");
    root.className = "tabs";
    const list = document.createElement("div");
    list.className = "tabs__list";
    root.appendChild(list);
    this.appendChild(root);
    this.#root = root;
    this.#list = list;
    this.#renderItems();
  }

  #renderItems() {
    const root = this.#root!;
    const list = this.#list!;
    list.textContent = "";
    for (const panel of this.#panels.values()) panel.remove();
    this.#tabs.clear();
    this.#panels.clear();

    for (const item of this.#items) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = item.iconOnly ? "tabs__tab tabs__tab--icon-only" : "tabs__tab";
      if (item.iconOnly) tab.setAttribute("aria-label", item.label ?? item.value);
      if (item.icon) {
        const icon = document.createElement("span");
        icon.className = "tabs__tab-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.appendChild(pathIcon(item.icon));
        tab.appendChild(icon);
      }
      if (!item.iconOnly) {
        const label = document.createElement("span");
        label.className = "tabs__tab-label";
        label.textContent = item.label ?? item.value;
        tab.appendChild(label);
      }
      if (item.count != null) {
        const count = document.createElement("span");
        count.className = "tabs__tab-count";
        count.setAttribute("aria-hidden", "true");
        count.textContent = String(item.count);
        tab.appendChild(count);
      }
      list.appendChild(tab);
      this.#tabs.set(item.value, tab);

      const panel = document.createElement("div");
      panel.className = "tabs__panel";
      const content = this.#renderPanel ? this.#renderPanel(item) : item.content;
      if (content instanceof Node) panel.appendChild(content);
      else panel.textContent = content == null ? "" : String(content);
      root.appendChild(panel);
      this.#panels.set(item.value, panel);
    }
  }

  #syncFromAttributes() {
    const requested = this.getAttribute("value");
    this.#value =
      requested != null && this.#items.some((item) => item.value === requested)
        ? requested
        : core.firstEnabled(this.#items);
    this.#apply();
  }

  #activationMode(): TabsActivationMode {
    return this.getAttribute("activation-mode") === "manual" ? "manual" : "automatic";
  }

  #api() {
    return core.connect({
      state: {
        value: this.#value,
        items: this.#items,
        orientation: "horizontal",
        activationMode: this.#activationMode(),
        id: this.#id,
      },
      setValue: (next) => {
        if (next === this.#value) return;
        this.#value = next;
        this.setAttribute("value", next);
        emit(this, "change", { value: next });
      },
      focus: (value) => this.#tabs.get(value)?.focus(),
    });
  }

  #apply() {
    const api = this.#api();
    applyProps(this.#list!, api.rootProps);
    this.#list!.setAttribute("aria-label", this.getAttribute("label") ?? "");
    for (const item of this.#items) {
      applyProps(this.#tabs.get(item.value)!, api.getTabProps(item.value));
      applyProps(this.#panels.get(item.value)!, api.getPanelProps(item.value));
    }
  }
}
