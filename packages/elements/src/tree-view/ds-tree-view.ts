import { treeView as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  sameItems,
  setChildren,
  upgradeProperty,
} from "../internal/base";
import { onLocaleChange, t } from "../internal/i18n";
import { treeCheckIcon, twistieIcon } from "../internal/icons";

export type TreeNode = core.TreeNode;
export type TreeLoadRequest = core.TreeLoadRequest;

/** The parts of one rendered row, kept while its node stays visible. */
interface TreeRow {
  item: HTMLLIElement;
  /** The twistie of a parent, the spacer of a leaf: one of the two is set. */
  twistie: HTMLButtonElement | null;
  spacer: HTMLSpanElement | null;
  label: HTMLSpanElement;
  status: HTMLSpanElement | null;
  check: HTMLSpanElement;
  /** The node the row shows, as of the last render. */
  node: core.VisibleNode;
}

let warnedUnlabelled = false;

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
 * Arrow on a failed node retries with a new request id. Loading and error
 * messages are announced through one visually hidden live region, created
 * once and updated in place. Right and Left Arrow follow the reading
 * direction.
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
  #live: HTMLElement | null = null;
  #root: HTMLUListElement | null = null;
  // The rendered rows by node value, updated in place on each render.
  #rows = new Map<string, TreeRow>();
  // The load message shown for each node, to announce only new ones.
  #messages = new Map<string, string>();

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
      disabled: boolAttr(this, "disabled"),
      id: this.id || this.#id,
    };
  }

  #api() {
    const state = this.#state();
    return core.connect({
      state,
      setExpanded: (expanded) => {
        if (sameItems(this.#expanded, expanded)) return;
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
      direction: getComputedStyle(this).direction === "rtl" ? "rtl" : "ltr",
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
    const state = this.#state();
    const api = this.#api();
    const root = (this.#root ??= document.createElement("ul"));
    root.className = "tree";
    const treeLabel = this.getAttribute("label");
    if (treeLabel) root.setAttribute("aria-label", treeLabel);
    else {
      root.removeAttribute("aria-label");
      if (!warnedUnlabelled) {
        warnedUnlabelled = true;
        console.warn("[ds] <ds-tree-view> needs a label attribute to name the tree.");
      }
    }
    applyProps(root, api.rootProps);
    const messages = new Map<string, string>();

    // Rows are keyed by value: a node that stays visible keeps its <li>, so
    // the row that has focus keeps it.
    const rows = new Map<string, TreeRow>();
    const items: HTMLLIElement[] = [];
    for (const node of core.visibleNodes(state)) {
      const known = rows.has(node.value) ? undefined : this.#rows.get(node.value);
      const row = known ?? this.#createRow(node);
      row.node = node;
      if (!rows.has(node.value)) rows.set(node.value, row);
      this.#updateRow(row, api, messages);
      items.push(row.item);
    }
    this.#rows = rows;
    setChildren(root, items);

    setChildren(this, [root, this.#liveRegion()]);
    this.#announce(messages);
    if (active) this.#item(active)?.focus({ preventScroll: true });
  }

  #createRow(node: core.VisibleNode): TreeRow {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.className = "tree__label";
    const check = document.createElement("span");
    check.setAttribute("aria-hidden", "true");
    check.innerHTML = treeCheckIcon();
    return { item, twistie: null, spacer: null, label, status: null, check, node };
  }

  /** Bring a row's parts in line with its node. */
  #updateRow(row: TreeRow, api: core.TreeApi, messages: Map<string, string>) {
    const { item, node } = row;
    const selected = node.value === this.#selected;
    item.className = "tree__item";
    if (selected) item.classList.add("tree__item--selected");
    item.style.setProperty("--_tree-level", String(node.level));
    applyProps(item, api.getItemProps(node.value));

    if (node.hasChildren) {
      row.spacer = null;
      if (!row.twistie) {
        const twistie = document.createElement("button");
        twistie.type = "button";
        twistie.tabIndex = -1;
        twistie.setAttribute("aria-hidden", "true");
        twistie.innerHTML = twistieIcon();
        twistie.addEventListener("click", (event) => {
          event.stopPropagation();
          const { value, loadState } = row.node;
          if (loadState === "error") this.#api().retryLoad(value);
          else this.#api().toggle(value);
        });
        row.twistie = twistie;
      }
      row.twistie.className = "tree__twistie";
      if (node.expanded) row.twistie.classList.add("tree__twistie--open");
    } else {
      row.twistie = null;
      if (!row.spacer) {
        const spacer = document.createElement("span");
        spacer.className = "tree__twistie-spacer";
        spacer.setAttribute("aria-hidden", "true");
        row.spacer = spacer;
      }
    }

    const name = this.#labels[node.value] ?? node.value;
    row.label.id = node.labelId;
    if (row.label.textContent !== name) row.label.textContent = name;

    if (node.loadState === "loading" || node.loadState === "error") {
      const status = (row.status ??= document.createElement("span"));
      status.id = node.loadStatusId;
      status.className = "tree__load-status";
      if (node.loadState === "error") status.classList.add("tree__load-status--error");
      const attribute = node.loadState === "error" ? "load-error-label" : "loading-label";
      const template = this.getAttribute(attribute);
      const text =
        template == null
          ? t(this, node.loadState === "error" ? "tree.loadError" : "tree.loading", { name })
          : template.replaceAll("{name}", name);
      if (status.textContent !== text) status.textContent = text;
      messages.set(node.value, text);
    } else {
      row.status = null;
    }

    row.check.className = "tree__check";
    if (selected) row.check.classList.add("tree__check--shown");

    const parts: Node[] = [row.twistie ?? row.spacer!, row.label];
    if (row.status) parts.push(row.status);
    parts.push(row.check);
    setChildren(item, parts);
  }

  #liveRegion() {
    if (!this.#live) {
      const live = document.createElement("span");
      live.className = "tree__live";
      live.setAttribute("role", "status");
      live.setAttribute("aria-atomic", "true");
      this.#live = live;
    }
    return this.#live;
  }

  /** Announce the load messages that are new since the last render. */
  #announce(messages: Map<string, string>) {
    const live = this.#live!;
    const fresh = [...messages].filter(([value, text]) => this.#messages.get(value) !== text);
    this.#messages = messages;
    if (fresh.length) live.textContent = fresh.map(([, text]) => text).join(" ");
    else if (!messages.size && live.textContent) live.textContent = "";
  }

  #item(value: string) {
    return Array.from(this.querySelectorAll<HTMLElement>("[data-value]")).find(
      (item) => item.dataset.value === value,
    );
  }
}
