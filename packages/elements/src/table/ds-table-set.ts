import { i18n, tabs as tabsCore } from "@design-system/core";
import {
  applyProps,
  definePart,
  emit,
  HTMLElementBase,
  setChildren,
  upgradeProperty,
} from "../internal/base";
import type {
  TableCellContent,
  TableCellContext,
  TableColumnDef,
  TableRow,
  TableSortState,
} from "./ds-table";
import { DsTableView, type TableRowId } from "./ds-table-view";

/** A named view (a tab): its own columns and rows. */
export interface TableViewDef {
  /** Stable id (the tab value). */
  id: string;
  /** Tab label. */
  label: string;
  columns: TableColumnDef[];
  rows: TableRow[];
  /** Accessible name for this view's table or card list. Defaults to `label`. */
  caption?: string;
}

/** Attributes every view receives as they are. */
const FORWARDED = [
  "hide-caption",
  "page-size",
  "page",
  "pagination-label",
  "infinite",
  "has-more",
  "loading",
  "load-more-label",
  "loading-label",
  "view",
  "allow-view-toggle",
  "configurable",
  "config-label",
  "card-title-key",
  "card-description-key",
  "selection-mode",
  "filters-active",
  "total-row-count",
  "filter-revision",
  "filters-clearable",
  "no-results-label",
];

/** Attributes the single view receives; with tabs, the set uses them itself. */
const SINGLE_VIEW = ["title", "title-level", "caption"];

type ViewProperty =
  | "sort"
  | "hiddenColumns"
  | "selectedRowIds"
  | "getValue"
  | "getRowId"
  | "isRowSelectable"
  | "getRowLabel"
  | "renderCell";

const t = (key: i18n.MessageKey) => i18n.translate(i18n.en, {}, i18n.DEFAULT_LOCALE, key);

/**
 * `<ds-table-set>` is the composed data table: a header with an optional
 * title and a toolbar region, optional tabs that switch between distinct views
 * (each with its own columns and rows), and one `<ds-table-view>` per view
 * with sorting, column visibility, a table/cards switcher, pagination or
 * infinite scroll, row selection and the no-results state.
 *
 * Without `views`, it renders a single view from `columns` and `rows`. With
 * `views`, the tabs follow the WAI-ARIA tabs pattern and selecting one swaps
 * the whole view, which starts again from its own default sort. Children
 * marked `slot="toolbar"` fill the header's toolbar region, read once when the
 * element first connects: put the application's filter controls there.
 *
 * Every other attribute and property is handed to the active view as it is,
 * and the view's events bubble through this element; see `<ds-table-view>`.
 * The active view id is a controllable mirror (ADR 0011): setting
 * `active-view` switches without an event; selecting a tab emits one.
 *
 * Attributes: `active-view`, `views-label`, `title`, `title-level`,
 * `caption`, `hide-caption`, `page-size`, `page`, `pagination-label`,
 * `infinite`, `has-more`, `loading`, `load-more-label`, `loading-label`,
 * `view` (table|card), `allow-view-toggle`, `configurable`, `config-label`,
 * `card-title-key`, `card-description-key`, `selection-mode`
 * (none|single|multiple), `filters-active`, `total-row-count`,
 * `filter-revision`, `filters-clearable`, `no-results-label`.
 * Properties: `columns`, `rows`, `views`, `activeView`, `sort`,
 * `hiddenColumns`, `selectedRowIds`, `getValue`, `getRowId`,
 * `isRowSelectable`, `getRowLabel`, `renderCell`.
 * Emits: `view-change` (`detail.id`) after a tab is selected, plus the
 * active view's `sort-change`, `hidden-columns-change`,
 * `selected-row-ids-change`, `page-change`, `load-more` and `clear-filters`.
 */
export class DsTableSet extends HTMLElementBase {
  // Spelled out: a computed list would read to bundlers as a possible side
  // effect and keep this class in every tree-shaken import.
  static observedAttributes = [
    "active-view",
    "views-label",
    "title",
    "title-level",
    "caption",
    "hide-caption",
    "page-size",
    "page",
    "pagination-label",
    "infinite",
    "has-more",
    "loading",
    "load-more-label",
    "loading-label",
    "view",
    "allow-view-toggle",
    "configurable",
    "config-label",
    "card-title-key",
    "card-description-key",
    "selection-mode",
    "filters-active",
    "total-row-count",
    "filter-revision",
    "filters-clearable",
    "no-results-label",
  ];

  #columns: TableColumnDef[] = [];
  #rows: TableRow[] = [];
  #views: TableViewDef[] = [];
  #properties: Partial<Record<ViewProperty, unknown>> = {};
  #activeId = "";
  #activeResolved = false;
  #toolbar: Node[] = [];
  #captured = false;
  #id = tabsCore.initialState({ items: [] }).id;

  #section: HTMLElement | null = null;
  #header: HTMLElement | null = null;
  #tabList: HTMLDivElement | null = null;
  #tabs = new Map<string, HTMLButtonElement>();
  #panels = new Map<string, HTMLDivElement>();
  #view: DsTableView | null = null;
  /** Which view `#view` renders: a view id, or null for the single view. */
  #viewKey: string | null = null;

  connectedCallback() {
    definePart("ds-table-view", DsTableView);
    for (const property of [
      "columns",
      "rows",
      "views",
      "activeView",
      "sort",
      "hiddenColumns",
      "selectedRowIds",
      "getValue",
      "getRowId",
      "isRowSelectable",
      "getRowLabel",
      "renderCell",
    ])
      upgradeProperty(this, property);
    if (!this.#captured) this.#capture();
    if (!this.#section) {
      const section = document.createElement("section");
      section.className = "table-set";
      this.appendChild(section);
      this.#section = section;
    }
    this.#update();
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null) {
    if (previous === next) return;
    if (name === "active-view") {
      if (next != null) this.#activeId = this.#resolve(next);
    } else if (FORWARDED.includes(name) || (SINGLE_VIEW.includes(name) && !this.#hasViews())) {
      // The view compares the value with its own, so forwarding is enough.
      if (this.#view) this.#copyAttribute(this.#view, name);
      if (name !== "title") return;
    }
    this.#update();
  }

  get columns(): TableColumnDef[] {
    return this.#columns;
  }
  set columns(value: TableColumnDef[]) {
    this.#columns = Array.isArray(value) ? value : [];
    if (this.#view && this.#viewKey === null) this.#view.columns = this.#columns;
  }

  get rows(): TableRow[] {
    return this.#rows;
  }
  set rows(value: TableRow[]) {
    this.#rows = Array.isArray(value) ? value : [];
    if (this.#view && this.#viewKey === null) this.#view.rows = this.#rows;
  }

  get views(): TableViewDef[] {
    return this.#views;
  }
  set views(value: TableViewDef[]) {
    const views = Array.isArray(value) ? value : [];
    if (views === this.#views) return;
    this.#views = views;
    if (views.length > 0 && !views.some((view) => view.id === this.#activeId)) {
      // The first time views arrive, `active-view` picks one; later, a view
      // that disappears hands over to the first, without an event.
      this.#activeId = this.#activeResolved
        ? views[0]!.id
        : this.#resolve(this.getAttribute("active-view"));
    }
    if (views.length > 0) this.#activeResolved = true;
    this.#update();
  }

  get activeView(): string | null {
    return this.#hasViews() ? this.#activeId : this.getAttribute("active-view");
  }
  set activeView(value: string | null) {
    if (value == null) this.removeAttribute("active-view");
    else this.setAttribute("active-view", value);
  }

  get sort() {
    return this.#properties.sort as TableSortState | null | undefined;
  }
  set sort(value: TableSortState | null | undefined) {
    this.#forward("sort", value);
  }

  get hiddenColumns() {
    return this.#properties.hiddenColumns as string[] | undefined;
  }
  set hiddenColumns(value: string[] | undefined) {
    this.#forward("hiddenColumns", value);
  }

  get selectedRowIds() {
    return this.#properties.selectedRowIds as TableRowId[] | undefined;
  }
  set selectedRowIds(value: TableRowId[] | undefined) {
    this.#forward("selectedRowIds", value);
  }

  get getValue() {
    return this.#properties.getValue as ((row: TableRow, key: string) => unknown) | undefined;
  }
  set getValue(value: ((row: TableRow, key: string) => unknown) | undefined) {
    this.#forward("getValue", value);
  }

  get getRowId() {
    return this.#properties.getRowId as ((row: TableRow, index: number) => TableRowId) | undefined;
  }
  set getRowId(value: ((row: TableRow, index: number) => TableRowId) | undefined) {
    this.#forward("getRowId", value);
  }

  get isRowSelectable() {
    return this.#properties.isRowSelectable as ((row: TableRow) => boolean) | undefined;
  }
  set isRowSelectable(value: ((row: TableRow) => boolean) | undefined) {
    this.#forward("isRowSelectable", value);
  }

  get getRowLabel() {
    return this.#properties.getRowLabel as ((row: TableRow) => string) | undefined;
  }
  set getRowLabel(value: ((row: TableRow) => string) | undefined) {
    this.#forward("getRowLabel", value);
  }

  get renderCell() {
    return this.#properties.renderCell as
      ((context: TableCellContext) => TableCellContent) | undefined;
  }
  set renderCell(value: ((context: TableCellContext) => TableCellContent) | undefined) {
    this.#forward("renderCell", value);
  }

  #forward(property: ViewProperty, value: unknown) {
    this.#properties[property] = value;
    if (this.#view) (this.#view as unknown as Record<string, unknown>)[property] = value;
  }

  #hasViews() {
    return this.#views.length > 0;
  }

  // A requested id counts only while it names a view; anything else resolves
  // to the first view, so the tabs and the panels always agree.
  #resolve(requested: string | null) {
    return this.#views.some((view) => view.id === requested)
      ? requested!
      : (this.#views[0]?.id ?? "");
  }

  #capture() {
    for (const node of Array.from(this.childNodes)) {
      if (node instanceof Element && node.getAttribute("slot") === "toolbar") {
        node.removeAttribute("slot");
        this.#toolbar.push(node);
      }
    }
    this.textContent = "";
    this.#captured = true;
  }

  #copyAttribute(view: DsTableView, name: string) {
    const value = this.getAttribute(name);
    if (value == null) view.removeAttribute(name);
    else view.setAttribute(name, value);
  }

  #createView(definition: TableViewDef | null): DsTableView {
    const view = new DsTableView();
    for (const name of FORWARDED) this.#copyAttribute(view, name);
    if (definition) {
      view.setAttribute("caption", definition.caption ?? definition.label);
    } else {
      for (const name of SINGLE_VIEW) this.#copyAttribute(view, name);
    }
    for (const [property, value] of Object.entries(this.#properties)) {
      if (value !== undefined) (view as unknown as Record<string, unknown>)[property] = value;
    }
    view.columns = definition ? definition.columns : this.#columns;
    view.rows = definition ? definition.rows : this.#rows;
    return view;
  }

  #update() {
    const section = this.#section;
    if (!section) return;
    const focused = document.activeElement;
    const restore = focused instanceof HTMLElement && this.contains(focused) ? focused : null;
    const hasViews = this.#hasViews();
    const active = hasViews ? this.#views.find((view) => view.id === this.#activeId)! : null;

    // Switching views mounts a fresh view, so each starts from its own
    // default sort; the same view updates in place.
    const key = active ? active.id : null;
    if (!this.#view || this.#viewKey !== key) {
      this.#view = this.#createView(active);
      this.#viewKey = key;
    } else if (active) {
      this.#view.setAttribute("caption", active.caption ?? active.label);
      this.#view.columns = active.columns;
      this.#view.rows = active.rows;
    }

    const nodes: Node[] = [];
    const header = this.#syncHeader(hasViews);
    if (header) nodes.push(header);
    if (hasViews) {
      nodes.push(...this.#syncPanels());
    } else {
      this.#panels.clear();
      nodes.push(this.#view);
    }
    setChildren(section, nodes);
    if (restore && restore.isConnected && document.activeElement !== restore) restore.focus();
  }

  #syncHeader(hasViews: boolean): HTMLElement | null {
    if (!hasViews && this.#toolbar.length === 0) return null;
    if (!this.#header) {
      this.#header = document.createElement("header");
      this.#header.className = "table-set__header";
    }
    const nodes: Node[] = [];
    const title = this.getAttribute("title");
    if (title && hasViews) {
      const heading = document.createElement(`h${this.#titleLevel()}`);
      heading.className = "table-set__title";
      heading.textContent = title;
      nodes.push(heading);
    }
    nodes.push(...this.#toolbar);
    if (hasViews) nodes.push(this.#syncTabs());
    setChildren(this.#header, nodes);
    return this.#header;
  }

  #titleLevel() {
    const value = Number(this.getAttribute("title-level") ?? 2);
    return Number.isInteger(value) && value >= 2 && value <= 6 ? value : 2;
  }

  #tabsApi() {
    return tabsCore.connect({
      state: {
        value: this.#activeId || null,
        items: this.#views.map((view) => ({ value: view.id })),
        orientation: "horizontal",
        activationMode: "automatic",
        id: this.#id,
      },
      setValue: (next) => {
        if (next === this.#activeId) return;
        this.#activeId = next;
        this.#update();
        emit(this, "view-change", { id: next });
      },
      focus: (value) => this.#tabs.get(value)?.focus(),
    });
  }

  #syncTabs(): HTMLDivElement {
    if (!this.#tabList) {
      this.#tabList = document.createElement("div");
      this.#tabList.className = "table-set__tabs";
    }
    const api = this.#tabsApi();
    const list = this.#tabList;
    applyProps(list, api.rootProps);
    list.setAttribute("aria-label", this.getAttribute("views-label") ?? t("table.views"));

    const ids = new Set(this.#views.map((view) => view.id));
    for (const id of this.#tabs.keys()) {
      if (!ids.has(id)) this.#tabs.delete(id);
    }
    const buttons = this.#views.map((view) => {
      let tab = this.#tabs.get(view.id);
      if (!tab) {
        tab = document.createElement("button");
        tab.className = "table-set__tab";
        this.#tabs.set(view.id, tab);
      }
      tab.textContent = view.label;
      applyProps(tab, api.getTabProps(view.id));
      return tab;
    });
    setChildren(list, buttons);
    return list;
  }

  #syncPanels(): HTMLDivElement[] {
    const api = this.#tabsApi();
    const ids = new Set(this.#views.map((view) => view.id));
    for (const id of this.#panels.keys()) {
      if (!ids.has(id)) this.#panels.delete(id);
    }
    return this.#views.map((view) => {
      let panel = this.#panels.get(view.id);
      if (!panel) {
        panel = document.createElement("div");
        this.#panels.set(view.id, panel);
      }
      applyProps(panel, api.getPanelProps(view.id));
      setChildren(panel, view.id === this.#activeId ? [this.#view!] : []);
      return panel;
    });
  }
}
