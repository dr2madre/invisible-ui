import {
  button as buttonCore,
  i18n,
  popover as popoverCore,
  radioGroup as radioCore,
  table as core,
} from "@design-system/core";
import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import {
  applyProps,
  boolAttr,
  definePart,
  emit,
  HTMLElementBase,
  nextId,
  setChildren,
  upgradeProperty,
} from "../internal/base";
import { settingsIcon } from "../internal/icons";
import { DsCard } from "../card/ds-card";
import { DsCheckbox } from "../checkbox/ds-checkbox";
import { DsEmptyState } from "../empty-state/ds-empty-state";
import { DsPagination } from "../pagination/ds-pagination";
import {
  DsTable,
  type TableCellContent,
  type TableCellContext,
  type TableColumnDef,
  type TableRow,
  type TableSortState,
} from "./ds-table";

export type TableRowId = core.RowId;
export type TableSelectionMode = core.SelectionMode;
export type TableBodyView = "table" | "card";

const t = (key: i18n.MessageKey, vars?: i18n.TranslateVars) =>
  i18n.translate(i18n.en, {}, i18n.DEFAULT_LOCALE, key, vars);

const defaultGetValue = (row: TableRow, key: string) => row[key];

// There is always an active sort: default to the first sortable column.
const defaultSort = (columns: TableColumnDef[]): TableSortState | null => {
  const key = columns.find((column) => column.sortable)?.key;
  return key ? { key, direction: "asc" } : null;
};

const sameItems = <T>(a: readonly T[], b: readonly T[]) =>
  a === b || (a.length === b.length && a.every((item, index) => item === b[index]));

const isOn = (value: string | null) => value !== null && value !== "false";

const numberAttr = (element: Element, name: string): number | undefined => {
  const raw = element.getAttribute(name);
  if (raw == null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

const appendContent = (parent: HTMLElement, content: TableCellContent) => {
  if (content instanceof Node) parent.appendChild(content);
  else parent.textContent = content == null ? "" : String(content);
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const VIEW_ITEMS: { value: TableBodyView; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "card", label: "Cards" },
];

/**
 * `<ds-table-view>` is one view of a data table: the body `<ds-table-set>`
 * renders for each of its views, usable on its own for a single view. It owns
 * sorting, column visibility, the table or cards layout and the current page,
 * and renders a header (optional title, a table/cards switcher, a column
 * settings popover), the body (a `<ds-table>` in a bordered card, or a
 * labelled list of `<ds-card>`s) and a footer (pagination or infinite scroll).
 *
 * Assign `columns` and `rows` as JavaScript properties, like `<ds-table>`.
 * Sorting is a two-state toggle and there is always an active sort: the first
 * sortable column, ascending, unless `sort` says otherwise. Every stateful
 * input is a controllable mirror (ADR 0011): setting it updates the view
 * without an event, a user action updates the view and then emits one event.
 *
 * Row selection needs a stable, unique id per row (`row.id` or `getRowId`) and
 * a name per row (`getRowLabel`) for its checkbox. A row without an id is not
 * selectable, the first of two rows sharing an id wins, and a checkbox without
 * a name falls back to the row id. The selection is never pruned.
 *
 * Filtering stays in the application: hand in the filtered `rows`. With zero
 * rows, `filters-active` and a `total-row-count` other than `0`, the view shows
 * a no-results Empty State; `filters-clearable` adds its Clear filters action.
 * Changing `filters-active` or `filter-revision` resets the page to one.
 *
 * Attributes: `caption`, `hide-caption`, `title`, `title-level`, `page-size`,
 * `page`, `pagination-label`, `infinite`, `has-more`, `loading`,
 * `load-more-label`, `loading-label`, `view` (table|card), `allow-view-toggle`,
 * `configurable`, `config-label`, `card-title-key`, `card-description-key`,
 * `selection-mode` (none|single|multiple), `filters-active`,
 * `total-row-count`, `filter-revision`, `filters-clearable`,
 * `no-results-label`.
 * Properties: `columns`, `rows`, `sort`, `hiddenColumns`, `selectedRowIds`,
 * `getValue`, `getRowId`, `isRowSelectable`, `getRowLabel`, `renderCell`,
 * `page`, `view`. `renderCell` returns a DOM Node or a scalar; strings are
 * inserted as text, never parsed as HTML.
 * Emits: `sort-change` (`detail.sort`), `hidden-columns-change`
 * (`detail.hiddenColumns`), `selected-row-ids-change`
 * (`detail.selectedRowIds`), `page-change` (`detail.page`), `load-more`,
 * `clear-filters`.
 */
export class DsTableView extends HTMLElementBase {
  static observedAttributes = [
    "caption",
    "hide-caption",
    "title",
    "title-level",
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
  #getValue: (row: TableRow, key: string) => unknown = defaultGetValue;
  #getRowId: ((row: TableRow, index: number) => TableRowId) | null = null;
  #isRowSelectable: (row: TableRow) => boolean = () => true;
  #getRowLabel: ((row: TableRow) => string) | null = null;
  #renderCell: ((context: TableCellContext) => TableCellContent) | null = null;

  // The last value handed in for each mirror: an identical hand-in is not a
  // change, so it cannot undo a local interaction.
  #sortInput: TableSortState | null = null;
  #hiddenInput: string[] | null = null;
  #selectedInput: TableRowId[] | null = null;

  #sort: TableSortState | null = null;
  #hidden: string[] = [];
  #selected: TableRowId[] = [];
  #view: TableBodyView = "table";
  #page = 1;
  #id = core.initialState({ columns: [] }).id;
  #connected = false;
  #initialized = false;
  #focusAfterClear = false;

  /** What the parts' callbacks read: the state of the latest render. */
  #frame: {
    api: core.TableApi;
    mode: TableSelectionMode;
    ids: Map<TableRow, TableRowId | null>;
    scope: TableRowId[];
  } | null = null;

  #root: HTMLDivElement | null = null;
  #header: HTMLElement | null = null;
  #controls: HTMLDivElement | null = null;
  #segmented: HTMLDivElement | null = null;
  #segmentInputs = new Map<TableBodyView, HTMLInputElement>();
  #trigger: HTMLButtonElement | null = null;
  #triggerLabel: HTMLSpanElement | null = null;
  #panel: HTMLDivElement | null = null;
  #configList: HTMLDivElement | null = null;
  #columnBoxes = new Map<string, DsCheckbox>();
  #popoverId = popoverCore.initialState({ id: nextId("ds-table-view-popover") }).id;
  #popoverOpen = false;
  #restoreFocus = false;
  #stopPopover: (() => void) | null = null;
  #tableCard: HTMLDivElement | null = null;
  #table: DsTable | null = null;
  #tableRowId: ((row: TableRow, index: number) => TableRowId) | null = null;
  #noResults: HTMLDivElement | null = null;
  #emptyState: DsEmptyState | null = null;
  #cardsSelectAll: HTMLDivElement | null = null;
  #cardList: HTMLDivElement | null = null;
  #selectAllBox: DsCheckbox | null = null;
  #rowBoxes = new Map<TableRowId, DsCheckbox>();
  #infinite: HTMLDivElement | null = null;
  #status: HTMLParagraphElement | null = null;
  #loadMore: HTMLButtonElement | null = null;
  #sentinel: HTMLDivElement | null = null;
  #observer: IntersectionObserver | null = null;
  #pager: HTMLDivElement | null = null;
  #pagination: DsPagination | null = null;

  connectedCallback() {
    for (const [tag, ctor] of [
      ["ds-table", DsTable],
      ["ds-pagination", DsPagination],
      ["ds-checkbox", DsCheckbox],
      ["ds-card", DsCard],
      ["ds-empty-state", DsEmptyState],
    ] as const)
      definePart(tag, ctor);
    for (const property of [
      "columns",
      "rows",
      "sort",
      "hiddenColumns",
      "selectedRowIds",
      "getValue",
      "getRowId",
      "isRowSelectable",
      "getRowLabel",
      "renderCell",
      "page",
      "view",
    ])
      upgradeProperty(this, property);
    if (!this.#initialized) {
      this.#page = numberAttr(this, "page") ?? 1;
      this.#view = this.#viewAttr();
      this.#initialized = true;
    }
    this.#connected = true;
    if (!this.#root) this.#build();
    this.#observe();
    this.#update();
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#closePopover(false);
    this.#observer?.disconnect();
    this.#observer = null;
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null) {
    if (previous === next) return;
    if (name === "page") this.#page = numberAttr(this, "page") ?? 1;
    else if (name === "view") this.#view = this.#viewAttr();
    else if (
      this.#initialized &&
      (name === "filter-revision" || (name === "filters-active" && isOn(previous) !== isOn(next)))
    ) {
      // The application's filters changed: back to page one, reported once.
      if (this.#page !== 1) {
        this.#page = 1;
        this.#update();
        emit(this, "page-change", { page: 1 });
        return;
      }
    }
    this.#update();
  }

  get columns(): TableColumnDef[] {
    return this.#columns;
  }
  set columns(value: TableColumnDef[]) {
    const columns = Array.isArray(value) ? value : [];
    if (columns === this.#columns) return;
    this.#columns = columns;
    // New columns keep the current sort while its key is still sortable.
    const current = this.#sort;
    if (!current || !columns.some((column) => column.key === current.key && column.sortable)) {
      this.#sort = defaultSort(columns);
    }
    this.#update();
  }

  get rows(): TableRow[] {
    return this.#rows;
  }
  set rows(value: TableRow[]) {
    this.#rows = Array.isArray(value) ? value : [];
    this.#update();
    // The clear action left with the no-results panel; when content returns,
    // the view root takes focus so it does not fall to the page.
    if (this.#focusAfterClear && this.#rows.length > 0) {
      this.#focusAfterClear = false;
      void Promise.resolve().then(() => this.#root?.focus());
    }
  }

  get sort(): TableSortState | null {
    return this.#sort;
  }
  set sort(value: TableSortState | null) {
    if (value === this.#sortInput) return;
    this.#sortInput = value ?? null;
    this.#sort = value ?? defaultSort(this.#columns);
    this.#update();
  }

  get hiddenColumns(): string[] {
    return this.#hidden;
  }
  set hiddenColumns(value: string[]) {
    if (value === this.#hiddenInput) return;
    this.#hiddenInput = value;
    this.#hidden = Array.isArray(value) ? value : [];
    this.#update();
  }

  get selectedRowIds(): TableRowId[] {
    return this.#selected;
  }
  set selectedRowIds(value: TableRowId[]) {
    if (value === this.#selectedInput) return;
    this.#selectedInput = value;
    const next = Array.isArray(value) ? value : [];
    // A controlled parent echoing the reported ids changes nothing.
    if (sameItems(next, this.#selected)) return;
    this.#selected = next;
    this.#update();
  }

  get getValue() {
    return this.#getValue;
  }
  set getValue(value: (row: TableRow, key: string) => unknown) {
    this.#getValue = typeof value === "function" ? value : defaultGetValue;
    this.#update();
  }

  get getRowId() {
    return this.#getRowId;
  }
  set getRowId(value: ((row: TableRow, index: number) => TableRowId) | null) {
    this.#getRowId = typeof value === "function" ? value : null;
    this.#update();
  }

  get isRowSelectable() {
    return this.#isRowSelectable;
  }
  set isRowSelectable(value: (row: TableRow) => boolean) {
    this.#isRowSelectable = typeof value === "function" ? value : () => true;
    this.#update();
  }

  get getRowLabel() {
    return this.#getRowLabel;
  }
  set getRowLabel(value: ((row: TableRow) => string) | null) {
    this.#getRowLabel = typeof value === "function" ? value : null;
    this.#update();
  }

  get renderCell() {
    return this.#renderCell;
  }
  set renderCell(value: ((context: TableCellContext) => TableCellContent) | null) {
    this.#renderCell = typeof value === "function" ? value : null;
    this.#update();
  }

  get page(): number {
    return this.#initialized ? this.#page : (numberAttr(this, "page") ?? 1);
  }
  set page(value: number) {
    this.setAttribute("page", String(value));
  }

  get view(): TableBodyView {
    return this.#initialized ? this.#view : this.#viewAttr();
  }
  set view(value: TableBodyView) {
    this.setAttribute("view", value);
  }

  #viewAttr(): TableBodyView {
    return this.getAttribute("view") === "card" ? "card" : "table";
  }

  #selectionMode(): TableSelectionMode {
    const mode = this.getAttribute("selection-mode");
    return mode === "single" || mode === "multiple" ? mode : "none";
  }

  #api(mode: TableSelectionMode) {
    return core.connect({
      state: {
        columns: this.#columns,
        sort: this.#sort,
        hiddenColumns: this.#hidden,
        selectionMode: mode,
        selectedRowIds: this.#selected,
        id: this.#id,
      },
      setSort: () => {},
      setHidden: (next) => {
        this.#hidden = next;
        this.#update();
        emit(this, "hidden-columns-change", { hiddenColumns: next });
      },
      setSelectedRowIds: (next) => {
        this.#selected = next;
        this.#update();
        emit(this, "selected-row-ids-change", { selectedRowIds: next });
      },
    });
  }

  // Two-state toggle (ascending and descending): the table is never unsorted.
  #toggleSort(key: string) {
    const current = this.#sort;
    const next: TableSortState =
      current && current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" };
    this.#sort = next;
    this.#update();
    emit(this, "sort-change", { sort: next });
  }

  #changePage(next: number) {
    if (next === this.#page) return;
    this.#page = next;
    this.#update();
    emit(this, "page-change", { page: next });
  }

  // Selection needs an id that survives sorting and paging, so the index
  // fallback of the default row id is not accepted here.
  #selectionIds(mode: TableSelectionMode) {
    const ids = new Map<TableRow, TableRowId | null>();
    if (mode === "none") return ids;
    const seen = new Set<TableRowId>();
    this.#rows.forEach((row, index) => {
      const id = this.#getRowId
        ? (this.#getRowId(row, index) ?? null)
        : ((row.id as TableRowId | undefined) ?? null);
      if (id == null || seen.has(id)) {
        ids.set(row, null);
        return;
      }
      seen.add(id);
      ids.set(row, id);
    });
    return ids;
  }

  #selectionLabel(row: TableRow, id: TableRowId) {
    const label = this.#getRowLabel?.(row);
    return label == null || label.trim() === "" ? String(id) : label;
  }

  #build() {
    this.textContent = "";
    const root = document.createElement("div");
    root.className = "table-view";
    root.tabIndex = -1;
    this.appendChild(root);
    this.#root = root;

    const header = document.createElement("header");
    header.className = "table-view__header";
    const controls = document.createElement("div");
    controls.className = "table-view__controls";
    this.#header = header;
    this.#controls = controls;

    const tableCard = document.createElement("div");
    tableCard.className = "table-view__card";
    const table = new DsTable();
    // The parts report to this view; their own events stop here.
    table.addEventListener("sort-toggle", (event) => {
      event.stopPropagation();
      this.#toggleSort((event as CustomEvent<{ key: string }>).detail.key);
    });
    table.renderSelectionHeader = () => this.#selectionHeader();
    table.renderSelectionCell = ({ row }) => {
      const id = this.#frame?.ids.get(row);
      return id != null && this.#isRowSelectable(row) ? this.#rowBox(row, id) : null;
    };
    tableCard.appendChild(table);
    this.#tableCard = tableCard;
    this.#table = table;
  }

  #update() {
    if (!this.#connected || !this.#root) return;
    const focused = document.activeElement;
    const restore = focused instanceof HTMLElement && this.contains(focused) ? focused : null;

    const mode = this.#selectionMode();
    const api = this.#api(mode);
    const infinite = boolAttr(this, "infinite");
    const pageSize = numberAttr(this, "page-size") ?? 0;
    const paginated = !infinite && pageSize > 0;
    const shownColumns = this.#columns.filter((column) => api.isColumnVisible(column.key));
    const sortedRows = api.sortRows(this.#rows, this.#getValue);
    const pageCount = paginated ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;

    // Clamp once when the data shrinks under the current page; reported
    // after the render.
    let clamped: number | null = null;
    if (this.#page > pageCount) {
      this.#page = pageCount;
      clamped = pageCount;
    }
    const visibleRows = paginated
      ? sortedRows.slice((this.#page - 1) * pageSize, this.#page * pageSize)
      : sortedRows;

    const ids = this.#selectionIds(mode);
    // Select-all only ever addresses the rendered slice.
    const scope =
      mode === "multiple"
        ? visibleRows.flatMap((row) => {
            const id = ids.get(row);
            return id != null && this.#isRowSelectable(row) ? [id] : [];
          })
        : [];
    this.#frame = { api, mode, ids, scope };
    this.#syncSelectAll();

    // Zero rows means "no results" only while filters are active and the
    // dataset itself is not empty; an unknown total counts as not empty.
    const noResults =
      this.#rows.length === 0 &&
      boolAttr(this, "filters-active") &&
      numberAttr(this, "total-row-count") !== 0;

    const rendered = new Set<TableRowId>();
    let body: Node[];
    if (noResults) body = [this.#noResultsPanel()];
    else if (this.#view === "card") body = this.#cards(visibleRows, shownColumns, rendered);
    else body = [this.#tableBody(visibleRows, shownColumns, rendered)];
    for (const id of this.#rowBoxes.keys()) {
      if (!rendered.has(id)) this.#rowBoxes.delete(id);
    }

    const nodes: Node[] = [];
    const header = this.#syncHeader(api);
    if (header) nodes.push(header);
    nodes.push(...body);
    if (infinite) nodes.push(this.#infiniteFooter());
    else if (paginated && pageCount > 1) nodes.push(this.#pagerFooter(pageCount));
    setChildren(this.#root, nodes);

    // A part may have moved the focused control while rebuilding around it.
    if (restore && restore.isConnected && document.activeElement !== restore) restore.focus();
    if (clamped != null) emit(this, "page-change", { page: clamped });
  }

  #syncHeader(api: core.TableApi): HTMLElement | null {
    const title = this.getAttribute("title");
    const toggle = boolAttr(this, "allow-view-toggle");
    const configurable = boolAttr(this, "configurable");
    if (!configurable) this.#closePopover(false);
    if (!title && !toggle && !configurable) return null;

    const header = this.#header!;
    const nodes: Node[] = [];
    if (title) {
      const heading = document.createElement(`h${this.#titleLevel()}`);
      heading.className = "table-view__title";
      heading.textContent = title;
      nodes.push(heading);
    }
    const controls: Node[] = [];
    if (toggle) controls.push(this.#syncSegmented());
    if (configurable) controls.push(this.#syncSettings(api));
    setChildren(this.#controls!, controls);
    nodes.push(this.#controls!);
    setChildren(header, nodes);
    return header;
  }

  #titleLevel() {
    const value = Number(this.getAttribute("title-level") ?? 2);
    return Number.isInteger(value) && value >= 2 && value <= 6 ? value : 2;
  }

  #syncSegmented(): HTMLDivElement {
    if (!this.#segmented) {
      const field = document.createElement("div");
      field.className = "segmented-field";
      const label = document.createElement("span");
      label.className = "segmented-field__label segmented-field__label--hidden";
      label.id = nextId("ds-segmented-label");
      label.textContent = "View";
      const group = document.createElement("div");
      group.className = "segmented";
      group.setAttribute("aria-labelledby", label.id);
      for (const item of VIEW_ITEMS) {
        const segment = document.createElement("label");
        segment.className = "segment";
        const input = document.createElement("input");
        input.className = "segment__input";
        const text = document.createElement("span");
        text.className = "segment__label";
        text.textContent = item.label;
        segment.append(input, text);
        group.appendChild(segment);
        this.#segmentInputs.set(item.value, input);
      }
      field.append(label, group);
      this.#segmented = field;
    }
    const name = `${this.#id}-view`;
    const api = radioCore.connect({
      state: { value: this.#view, items: VIEW_ITEMS, orientation: "horizontal", disabled: false },
      name,
      setValue: (next) => {
        const view: TableBodyView = next === "card" ? "card" : "table";
        if (view === this.#view) return;
        this.#view = view;
        this.#update();
      },
    });
    applyProps(this.#segmented.querySelector(".segmented")!, api.rootProps);
    for (const [value, input] of this.#segmentInputs) {
      applyProps(input, api.getItemProps(value));
      input.checked = value === this.#view;
    }
    return this.#segmented;
  }

  #syncSettings(api: core.TableApi): HTMLButtonElement {
    const label = this.getAttribute("config-label") ?? t("table.columns");
    if (!this.#trigger) {
      const trigger = document.createElement("button");
      trigger.className = "button";
      const settings = document.createElement("span");
      settings.className = "table-view__settings";
      settings.innerHTML = settingsIcon();
      const sr = document.createElement("span");
      sr.className = "table-view__sr";
      settings.appendChild(sr);
      trigger.appendChild(settings);
      this.#trigger = trigger;
      this.#triggerLabel = sr;

      const panel = document.createElement("div");
      panel.className = "popover__content";
      // Only a keyboard dismissal sends focus back to the trigger. Capture
      // phase: the flag must be set before the close handler runs.
      panel.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape") this.#restoreFocus = true;
        },
        true,
      );
      const list = document.createElement("div");
      list.className = "table-view__config-list";
      list.setAttribute("role", "group");
      panel.appendChild(list);
      this.#panel = panel;
      this.#configList = list;
    }
    this.#triggerLabel!.textContent = label;
    this.#configList!.setAttribute("aria-label", label);

    const boxes = this.#columns.map((column) => {
      let box = this.#columnBoxes.get(column.key);
      if (!box) {
        box = new DsCheckbox();
        box.addEventListener("change", (event) => {
          event.stopPropagation();
          this.#frame?.api.toggleColumnVisibility(column.key);
        });
        this.#columnBoxes.set(column.key, box);
      }
      box.setAttribute("label", column.header);
      box.toggleAttribute("disabled", column.hideable === false);
      box.checked = api.isColumnVisible(column.key);
      return box;
    });
    const keys = new Set(this.#columns.map((column) => column.key));
    for (const key of this.#columnBoxes.keys()) {
      if (!keys.has(key)) this.#columnBoxes.delete(key);
    }
    setChildren(this.#configList!, boxes);
    this.#syncPopover();
    return this.#trigger!;
  }

  #popoverApi() {
    return popoverCore.connect({
      state: { open: this.#popoverOpen, id: this.#popoverId },
      setOpen: (open) => (open ? this.#openPopover() : this.#closePopover(this.#restoreFocus)),
    });
  }

  #syncPopover() {
    const trigger = this.#trigger!;
    const button = buttonCore.connect({
      state: buttonCore.initialState({ variant: "default" }),
      type: "button",
    });
    const api = this.#popoverApi();
    applyProps(trigger, button.rootProps);
    applyProps(trigger, api.triggerProps);
    applyProps(this.#panel!, api.contentProps);
  }

  #openPopover() {
    if (this.#popoverOpen || !this.#trigger || !this.#panel) return;
    this.#popoverOpen = true;
    this.#restoreFocus = false;
    this.#syncPopover();
    const trigger = this.#trigger;
    const panel = this.#panel;
    document.body.appendChild(panel);

    const reposition = () =>
      computePosition(trigger, panel, {
        placement: "bottom-end",
        strategy: "fixed",
        middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
      });
    const stopFloating =
      typeof ResizeObserver !== "undefined"
        ? autoUpdate(trigger, panel, reposition)
        : (void reposition(), () => {});
    // A press outside, or focus leaving both parts, closes without moving focus.
    const onPointerDown = (event: Event) => {
      const target = event.target as Node;
      if (!panel.contains(target) && !trigger.contains(target)) this.#closePopover(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!panel.contains(target) && !trigger.contains(target)) this.#closePopover(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn);
    this.#stopPopover = () => {
      stopFloating();
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn);
    };
    (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();
  }

  #closePopover(restoreFocus: boolean) {
    if (!this.#popoverOpen) return;
    this.#popoverOpen = false;
    this.#restoreFocus = false;
    this.#stopPopover?.();
    this.#stopPopover = null;
    this.#panel?.remove();
    if (this.#trigger) this.#syncPopover();
    if (restoreFocus && this.#trigger?.isConnected) this.#trigger.focus();
  }

  #selectionHeader(): TableCellContent {
    if (this.#frame?.mode === "multiple") {
      const box = this.#syncSelectAll();
      box.setAttribute("hide-label", "");
      return box;
    }
    const label = document.createElement("span");
    label.className = "table-view__sr";
    label.textContent = t("table.selection");
    return label;
  }

  #syncSelectAll(): DsCheckbox {
    if (!this.#selectAllBox) {
      const box = new DsCheckbox();
      box.addEventListener("change", (event) => {
        event.stopPropagation();
        const frame = this.#frame;
        frame?.api.toggleScopeSelection(frame.scope);
      });
      this.#selectAllBox = box;
    }
    const box = this.#selectAllBox;
    const frame = this.#frame;
    const state =
      frame && frame.mode === "multiple" ? frame.api.getScopeSelectionState(frame.scope) : "none";
    box.setAttribute("label", t("table.selectPage"));
    box.toggleAttribute("disabled", !frame || frame.scope.length === 0);
    box.checked = state === "all" ? true : state === "some" ? "indeterminate" : false;
    return box;
  }

  #rowBox(row: TableRow, id: TableRowId): DsCheckbox {
    let box = this.#rowBoxes.get(id);
    if (!box) {
      box = new DsCheckbox();
      box.setAttribute("hide-label", "");
      box.addEventListener("change", (event) => {
        event.stopPropagation();
        this.#frame?.api.toggleRowSelection(id);
      });
      this.#rowBoxes.set(id, box);
    }
    box.setAttribute("label", t("table.selectRow", { name: this.#selectionLabel(row, id) }));
    box.checked = this.#frame?.api.isRowSelected(id) ?? false;
    return box;
  }

  #tableBody(
    visibleRows: TableRow[],
    shownColumns: TableColumnDef[],
    rendered: Set<TableRowId>,
  ): HTMLDivElement {
    const table = this.#table!;
    const frame = this.#frame!;
    const selection = frame.mode !== "none";
    const caption = this.getAttribute("caption");
    const hideCaption = boolAttr(this, "hide-caption") || !!this.getAttribute("title");

    const setAttr = (name: string, value: string | null) => {
      if (table.getAttribute(name) !== value) {
        if (value == null) table.removeAttribute(name);
        else table.setAttribute(name, value);
      }
    };
    setAttr("caption", caption);
    setAttr("hide-caption", hideCaption ? "" : null);
    setAttr("selection-column", selection ? "" : null);
    const sort = frame.api.sort;
    const current = table.sort;
    if (current?.key !== sort?.key || current?.direction !== sort?.direction) table.sort = sort;
    if (table.getValue !== this.#getValue) table.getValue = this.#getValue;
    if (this.#tableRowId !== this.#getRowId) {
      this.#tableRowId = this.#getRowId;
      table.getRowId = this.#getRowId as (row: TableRow, index: number) => TableRowId;
    }
    if (table.renderCell !== this.#renderCell) table.renderCell = this.#renderCell;
    if (!sameItems(table.columns, shownColumns)) table.columns = shownColumns;
    if (!sameItems(table.rows, visibleRows)) table.rows = visibleRows;
    // A fresh function on every render in selection mode: it makes the table
    // re-evaluate its rows' data-selected and selection cells.
    table.isRowSelected = selection
      ? (row) => {
          const id = frame.ids.get(row);
          return id != null && frame.api.isRowSelected(id);
        }
      : null;
    if (selection) {
      for (const row of visibleRows) {
        const id = frame.ids.get(row);
        if (id != null) rendered.add(id);
      }
    }
    return this.#tableCard!;
  }

  #cards(
    visibleRows: TableRow[],
    shownColumns: TableColumnDef[],
    rendered: Set<TableRowId>,
  ): Node[] {
    const frame = this.#frame!;
    const nodes: Node[] = [];
    if (frame.mode === "multiple") {
      if (!this.#cardsSelectAll) {
        this.#cardsSelectAll = document.createElement("div");
        this.#cardsSelectAll.className = "table-view__cards-select-all";
      }
      const box = this.#syncSelectAll();
      box.removeAttribute("hide-label");
      setChildren(this.#cardsSelectAll, [box]);
      nodes.push(this.#cardsSelectAll);
    }

    const titleKey = this.getAttribute("card-title-key") ?? this.#columns[0]?.key;
    const descriptionKey = this.getAttribute("card-description-key");
    const fieldColumns = shownColumns.filter(
      (column) => column.key !== titleKey && column.key !== descriptionKey,
    );
    if (!this.#cardList) {
      this.#cardList = document.createElement("div");
      this.#cardList.className = "table-view__cards";
      this.#cardList.setAttribute("role", "list");
    }
    const list = this.#cardList;
    const caption = this.getAttribute("caption");
    if (caption == null) list.removeAttribute("aria-label");
    else list.setAttribute("aria-label", caption);
    const items: HTMLElement[] = [];

    visibleRows.forEach((row, rowIndex) => {
      const item = document.createElement("div");
      item.setAttribute("role", "listitem");
      const id = frame.ids.get(row) ?? null;
      if (id != null) rendered.add(id);
      if (id != null && frame.api.isRowSelected(id)) item.dataset.selected = "";
      if (id != null && this.#isRowSelectable(row)) {
        item.className = "table-view__card-item";
        item.appendChild(this.#rowBox(row, id));
      }

      const card = new DsCard();
      if (titleKey != null) card.setAttribute("title", String(this.#getValue(row, titleKey)));
      if (descriptionKey != null)
        card.setAttribute("description", String(this.#getValue(row, descriptionKey)));
      const fields = document.createElement("dl");
      fields.className = "table-view__card-fields";
      for (const column of fieldColumns) {
        const value = this.#getValue(row, column.key);
        const field = document.createElement("div");
        field.className = "table-view__card-field";
        const term = document.createElement("dt");
        term.className = "table-view__card-label";
        term.textContent = column.header;
        const detail = document.createElement("dd");
        detail.className = "table-view__card-value";
        appendContent(
          detail,
          this.#renderCell
            ? this.#renderCell({ row, column, value, rowIndex })
            : value == null
              ? ""
              : String(value),
        );
        field.append(term, detail);
        fields.appendChild(field);
      }
      card.appendChild(fields);
      item.appendChild(card);
      items.push(item);
    });
    setChildren(list, items);
    nodes.push(list);
    return nodes;
  }

  #noResultsPanel(): HTMLDivElement {
    if (!this.#noResults) {
      const panel = document.createElement("div");
      panel.className = "table-view__no-results";
      const empty = new DsEmptyState();
      empty.addEventListener("action", (event) => {
        event.stopPropagation();
        this.#focusAfterClear = true;
        emit(this, "clear-filters");
      });
      panel.appendChild(empty);
      this.#noResults = panel;
      this.#emptyState = empty;
    }
    const empty = this.#emptyState!;
    const title = this.getAttribute("no-results-label") ?? t("table.noResults");
    if (empty.getAttribute("title") !== title) empty.setAttribute("title", title);
    const action = boolAttr(this, "filters-clearable") ? t("table.clearFilters") : null;
    if (empty.getAttribute("action-label") !== action) {
      if (action == null) empty.removeAttribute("action-label");
      else empty.setAttribute("action-label", action);
    }
    return this.#noResults;
  }

  #infiniteFooter(): HTMLDivElement {
    if (!this.#infinite) {
      const footer = document.createElement("div");
      footer.className = "table-view__infinite";
      const status = document.createElement("p");
      status.className = "table-view__status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      const loadMore = document.createElement("button");
      loadMore.type = "button";
      loadMore.className = "table-view__load-more";
      loadMore.addEventListener("click", () => emit(this, "load-more"));
      const sentinel = document.createElement("div");
      sentinel.className = "table-view__sentinel";
      sentinel.setAttribute("aria-hidden", "true");
      this.#infinite = footer;
      this.#status = status;
      this.#loadMore = loadMore;
      this.#sentinel = sentinel;
      this.#observe();
    }
    const loading = boolAttr(this, "loading");
    const loadingLabel = this.getAttribute("loading-label") ?? t("table.loading");
    this.#status!.textContent = loading ? loadingLabel : "";
    this.#loadMore!.disabled = loading;
    this.#loadMore!.textContent = loading
      ? loadingLabel
      : (this.getAttribute("load-more-label") ?? t("table.loadMore"));
    const nodes: Node[] = [this.#status!];
    if (boolAttr(this, "has-more")) nodes.push(this.#loadMore!);
    nodes.push(this.#sentinel!);
    setChildren(this.#infinite, nodes);
    return this.#infinite;
  }

  // The sentinel loads more as soon as the end of the list comes into view.
  #observe() {
    if (this.#observer || !this.#sentinel || typeof IntersectionObserver === "undefined") return;
    this.#observer = new IntersectionObserver((entries) => {
      if (
        entries.some((entry) => entry.isIntersecting) &&
        boolAttr(this, "has-more") &&
        !boolAttr(this, "loading")
      )
        emit(this, "load-more");
    });
    this.#observer.observe(this.#sentinel);
  }

  #pagerFooter(pageCount: number): HTMLDivElement {
    if (!this.#pager) {
      const footer = document.createElement("div");
      footer.className = "table-view__pagination";
      const pagination = new DsPagination();
      pagination.addEventListener("change", (event) => {
        event.stopPropagation();
        this.#changePage((event as CustomEvent<{ page: number }>).detail.page);
      });
      footer.appendChild(pagination);
      this.#pager = footer;
      this.#pagination = pagination;
    }
    const pagination = this.#pagination!;
    pagination.setAttribute("page-count", String(pageCount));
    pagination.setAttribute("page", String(this.#page));
    pagination.setAttribute(
      "label",
      this.getAttribute("pagination-label") ?? t("table.pagination"),
    );
    return this.#pager;
  }
}
