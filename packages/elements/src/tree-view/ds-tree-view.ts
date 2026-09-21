import { treeView as core } from "@design-system/core";
import { applyProps, emit, HTMLElementBase, nextId, upgradeProperty } from "../internal/base";

export type TreeNode = core.TreeNode;

const twistieIcon = `
  <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
    <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.75"
      stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>`;

const checkIcon = `
  <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="1.75"
      stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>`;

/**
 * `<ds-tree-view>` implements the single-select WAI-ARIA tree pattern.
 *
 * Set `nodes` as a property to a nested `TreeNode[]`; `expanded`, `selected`,
 * and `labels` are reactive properties. The `label` and `disabled` attributes
 * are reactive.
 *
 * Emits: `expanded-change` with `detail.expanded`, and `selected-change` with
 * `detail.selected`. Property reflection never emits either event.
 */
export class DsTreeView extends HTMLElementBase {
  static observedAttributes = ["label", "disabled"];

  #nodes: TreeNode[] = [];
  #expanded: string[] = [];
  #selected: string | null = null;
  #focused: string | null = null;
  #labels: Record<string, string> = {};
  #id = nextId("ds-tree");

  connectedCallback() {
    for (const property of ["nodes", "expanded", "selected", "labels"]) {
      upgradeProperty(this, property);
    }
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  get nodes() {
    return this.#nodes;
  }
  set nodes(value: TreeNode[]) {
    this.#nodes = Array.isArray(value) ? value : [];
    if (this.isConnected) this.#render();
  }

  get expanded() {
    return this.#expanded;
  }
  set expanded(value: string[]) {
    this.#expanded = Array.isArray(value) ? [...new Set(value)] : [];
    if (this.isConnected) this.#render();
  }

  get selected() {
    return this.#selected;
  }
  set selected(value: string | null) {
    this.#selected = typeof value === "string" ? value : null;
    if (this.isConnected) this.#render();
  }

  get labels() {
    return this.#labels;
  }
  set labels(value: Record<string, string>) {
    this.#labels = value && typeof value === "object" ? value : {};
    if (this.isConnected) this.#render();
  }

  #state(): core.TreeState {
    return {
      nodes: this.#nodes,
      expanded: this.#expanded,
      selected: this.#selected,
      focused: this.#focused,
      disabled: this.hasAttribute("disabled"),
      id: this.id || this.#id,
    };
  }

  #api() {
    const state = this.#state();
    return core.connect({
      state,
      setExpanded: (expanded) => {
        if (this.#same(this.#expanded, expanded)) return;
        this.#expanded = expanded;
        this.#render();
        emit(this, "expanded-change", { expanded: [...expanded] });
      },
      setSelected: (selected) => {
        if (this.#selected === selected) return;
        this.#selected = selected;
        this.#render();
        emit(this, "selected-change", { selected });
      },
      setFocused: (focused) => {
        if (this.#focused === focused) return;
        this.#focused = focused;
        for (const item of this.querySelectorAll<HTMLElement>("[data-value]")) {
          if (item.getAttribute("aria-disabled") === "true") item.removeAttribute("tabindex");
          else item.tabIndex = item.dataset.value === focused ? 0 : -1;
        }
      },
      focus: (value) => this.#item(value)?.focus(),
    });
  }

  #render() {
    const active = this.contains(document.activeElement)
      ? (document.activeElement as Element).closest<HTMLElement>("[data-value]")?.dataset.value
      : undefined;
    this.textContent = "";
    const state = this.#state();
    const api = this.#api();
    const root = document.createElement("ul");
    root.className = "tree";
    root.setAttribute("aria-label", this.getAttribute("label") ?? "");
    applyProps(root, api.rootProps);

    for (const node of core.visibleNodes(state)) {
      const item = document.createElement("li");
      item.className = "tree__item";
      if (node.value === this.#selected) item.classList.add("tree__item--selected");
      item.style.setProperty("--_tree-level", String(node.level));
      applyProps(item, api.getItemProps(node.value));

      if (node.hasChildren) {
        const twistie = document.createElement("button");
        twistie.type = "button";
        twistie.className = "tree__twistie";
        if (node.expanded) twistie.classList.add("tree__twistie--open");
        twistie.tabIndex = -1;
        twistie.setAttribute("aria-hidden", "true");
        twistie.innerHTML = twistieIcon;
        twistie.addEventListener("click", (event) => {
          event.stopPropagation();
          this.#api().toggle(node.value);
        });
        item.appendChild(twistie);
      } else {
        const spacer = document.createElement("span");
        spacer.className = "tree__twistie-spacer";
        spacer.setAttribute("aria-hidden", "true");
        item.appendChild(spacer);
      }

      const label = document.createElement("span");
      label.className = "tree__label";
      label.textContent = this.#labels[node.value] ?? node.value;
      item.appendChild(label);

      const check = document.createElement("span");
      check.className = "tree__check";
      if (node.value === this.#selected) check.classList.add("tree__check--shown");
      check.setAttribute("aria-hidden", "true");
      check.innerHTML = checkIcon;
      item.appendChild(check);
      root.appendChild(item);
    }

    this.appendChild(root);
    if (active) this.#item(active)?.focus({ preventScroll: true });
  }

  #item(value: string) {
    return Array.from(this.querySelectorAll<HTMLElement>("[data-value]")).find(
      (item) => item.dataset.value === value,
    );
  }

  #same(left: string[], right: string[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }
}
