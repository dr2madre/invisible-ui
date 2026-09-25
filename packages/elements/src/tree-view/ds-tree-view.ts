import { treeView as core } from "@design-system/core";
import { applyProps, emit, HTMLElementBase, nextId, upgradeProperty } from "../internal/base";
import { onLocaleChange, t } from "../internal/i18n";

export type TreeNode = core.TreeNode;
export type TreeLoadRequest = core.TreeLoadRequest;

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
 * `loading`, `loadErrors`, and `labels` are reactive properties. The `label`,
 * `disabled`, `loading-label`, and `load-error-label` attributes are reactive.
 *
 * A node with `hasChildren: true` and no `children` is an unloaded parent.
 * Expanding it, or pressing Right Arrow on it, fires `load-children` with
 * `detail.value` and `detail.requestId`; the element never fetches. Reflect
 * the request through `loading`, then replace `nodes` and clear `loading` on
 * success, or move the value to `loadErrors` on failure. The twistie or Right
 * Arrow on a failed node retries with a new request id.
 *
 * Emits: `expanded-change` with `detail.expanded`, `selected-change` with
 * `detail.selected`, and `load-children` with `detail.value` and
 * `detail.requestId`. Property reflection never emits any of them.
 */
export class DsTreeView extends HTMLElementBase {
  static observedAttributes = ["label", "disabled", "loading-label", "load-error-label"];

  #nodes: TreeNode[] = [];
  #expanded: string[] = [];
  #selected: string | null = null;
  #loading: string[] = [];
  #loadErrors: string[] = [];
  #focused: string | null = null;
  #labels: Record<string, string> = {};
  #id = nextId("ds-tree");

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.isConnected) this.#render();
    });
  }

  connectedCallback() {
    for (const property of ["nodes", "expanded", "selected", "loading", "loadErrors", "labels"]) {
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

  get loading() {
    return this.#loading;
  }
  set loading(value: string[]) {
    this.#loading = Array.isArray(value) ? [...new Set(value)] : [];
    if (this.isConnected) this.#render();
  }

  get loadErrors() {
    return this.#loadErrors;
  }
  set loadErrors(value: string[]) {
    this.#loadErrors = Array.isArray(value) ? [...new Set(value)] : [];
    if (this.isConnected) this.#render();
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
      loading: this.#loading,
      loadErrors: this.#loadErrors,
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
      requestLoad: (request) => {
        if (this.#loading.includes(request.value)) return;
        this.#loading = [...this.#loading, request.value];
        this.#loadErrors = this.#loadErrors.filter((value) => value !== request.value);
        this.#render();
        emit(this, "load-children", request);
      },
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
          if (node.loadState === "error") this.#api().retryLoad(node.value);
          else this.#api().toggle(node.value);
        });
        item.appendChild(twistie);
      } else {
        const spacer = document.createElement("span");
        spacer.className = "tree__twistie-spacer";
        spacer.setAttribute("aria-hidden", "true");
        item.appendChild(spacer);
      }

      const label = document.createElement("span");
      label.id = node.labelId;
      label.className = "tree__label";
      label.textContent = this.#labels[node.value] ?? node.value;
      item.appendChild(label);

      if (node.loadState === "loading" || node.loadState === "error") {
        const status = document.createElement("span");
        status.id = node.loadStatusId;
        status.className = "tree__load-status";
        if (node.loadState === "error") status.classList.add("tree__load-status--error");
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.setAttribute("aria-atomic", "true");
        const name = this.#labels[node.value] ?? node.value;
        const attribute = node.loadState === "error" ? "load-error-label" : "loading-label";
        const template = this.getAttribute(attribute);
        status.textContent =
          template == null
            ? t(this, node.loadState === "error" ? "tree.loadError" : "tree.loading", { name })
            : template.replaceAll("{name}", name);
        item.appendChild(status);
      }

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
