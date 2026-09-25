import { boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { sortIcon } from "../internal/icons";

export type SortDirection = "asc" | "desc";

export interface TableSortState {
  key: string;
  direction: SortDirection;
}

export interface TableColumnDef {
  /** Stable key and default accessor into a row. */
  key: string;
  /** Header label. */
  header: string;
  /** Whether the column can be sorted. */
  sortable?: boolean;
  /** Whether the column can be hidden by a composition such as Table Set. */
  hideable?: boolean;
  /** Text alignment for the column's header and cells. */
  align?: "start" | "center" | "end";
}

export type TableRow = Record<string, unknown>;
export type TableCellContent = Node | string | number | null | undefined;
export interface TableCellContext {
  row: TableRow;
  column: TableColumnDef;
  value: unknown;
  rowIndex: number;
}
export interface TableSelectionCellContext {
  row: TableRow;
  rowId: string | number;
  rowIndex: number;
}

const defaultGetValue = (row: TableRow, key: string) => row[key];
const defaultGetRowId = (row: TableRow, index: number): string | number =>
  (row.id as string | number) ?? index;

const appendContent = (parent: HTMLElement, content: TableCellContent) => {
  if (content instanceof Node) parent.appendChild(content);
  else parent.textContent = content == null ? "" : String(content);
};

/**
 * `<ds-table>` renders the same controlled native table as the Svelte and Vue
 * adapters. Assign `columns` and `rows` as JavaScript properties. Sorting is
 * reflected through `sort` or the `sort-key` / `sort-direction` attributes and
 * reported as `sort-toggle` with `detail.key`; the element never reorders rows.
 *
 * `renderCell` is the Elements equivalent of the adapters' scoped cell slot.
 * It may return a DOM Node or a scalar value. Strings are inserted as text,
 * never parsed as HTML.
 *
 * Attributes: `caption`, `hide-caption`, `sort-key`, `sort-direction`,
 * `selection-column`, `empty-text`.
 * Properties: `columns`, `rows`, `sort`, `getValue`, `getRowId`, `renderCell`,
 * `isRowSelected`, `renderSelectionHeader`, `renderSelectionCell`,
 * `renderEmpty`. `renderEmpty` supplies rich DOM content when there are no
 * rows; `empty-text` is the text-only alternative.
 * Emits: `sort-toggle` (`detail.key`) after a sortable header is activated.
 */
export class DsTable extends HTMLElementBase {
  static observedAttributes = [
    "caption",
    "hide-caption",
    "sort-key",
    "sort-direction",
    "selection-column",
    "empty-text",
  ];

  #columns: TableColumnDef[] = [];
  #rows: TableRow[] = [];
  #getValue: (row: TableRow, key: string) => unknown = defaultGetValue;
  #getRowId: (row: TableRow, index: number) => string | number = defaultGetRowId;
  #renderCell: ((context: TableCellContext) => TableCellContent) | null = null;
  #isRowSelected: ((row: TableRow, rowIndex: number) => boolean) | null = null;
  #renderSelectionHeader: (() => TableCellContent) | null = null;
  #renderSelectionCell: ((context: TableSelectionCellContext) => TableCellContent) | null = null;
  #renderEmpty: (() => TableCellContent) | null = null;
  #sortButtons = new Map<string, HTMLButtonElement>();
  #connected = false;

  connectedCallback() {
    for (const property of [
      "columns",
      "rows",
      "sort",
      "getValue",
      "getRowId",
      "renderCell",
      "isRowSelected",
      "renderSelectionHeader",
      "renderSelectionCell",
      "renderEmpty",
    ])
      upgradeProperty(this, property);
    this.#connected = true;
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#connected) this.#render();
  }

  get columns(): TableColumnDef[] {
    return this.#columns;
  }
  set columns(value: TableColumnDef[]) {
    this.#columns = Array.isArray(value) ? value : [];
    if (this.#connected) this.#render();
  }

  get rows(): TableRow[] {
    return this.#rows;
  }
  set rows(value: TableRow[]) {
    this.#rows = Array.isArray(value) ? value : [];
    if (this.#connected) this.#render();
  }

  get sort(): TableSortState | null {
    const key = this.getAttribute("sort-key");
    const direction = this.getAttribute("sort-direction");
    return key && (direction === "asc" || direction === "desc") ? { key, direction } : null;
  }
  set sort(value: TableSortState | null) {
    if (value) {
      this.setAttribute("sort-key", value.key);
      this.setAttribute("sort-direction", value.direction);
    } else {
      this.removeAttribute("sort-key");
      this.removeAttribute("sort-direction");
    }
  }

  get getValue() {
    return this.#getValue;
  }
  set getValue(value: (row: TableRow, key: string) => unknown) {
    this.#getValue = typeof value === "function" ? value : defaultGetValue;
    if (this.#connected) this.#render();
  }

  get getRowId() {
    return this.#getRowId;
  }
  set getRowId(value: (row: TableRow, index: number) => string | number) {
    this.#getRowId = typeof value === "function" ? value : defaultGetRowId;
    if (this.#connected) this.#render();
  }

  get renderCell() {
    return this.#renderCell;
  }
  set renderCell(value: ((context: TableCellContext) => TableCellContent) | null) {
    this.#renderCell = typeof value === "function" ? value : null;
    if (this.#connected) this.#render();
  }

  get isRowSelected() {
    return this.#isRowSelected;
  }
  set isRowSelected(value: ((row: TableRow, rowIndex: number) => boolean) | null) {
    this.#isRowSelected = typeof value === "function" ? value : null;
    if (this.#connected) this.#render();
  }

  get renderSelectionHeader() {
    return this.#renderSelectionHeader;
  }
  set renderSelectionHeader(value: (() => TableCellContent) | null) {
    this.#renderSelectionHeader = typeof value === "function" ? value : null;
    if (this.#connected) this.#render();
  }

  get renderSelectionCell() {
    return this.#renderSelectionCell;
  }
  set renderSelectionCell(
    value: ((context: TableSelectionCellContext) => TableCellContent) | null,
  ) {
    this.#renderSelectionCell = typeof value === "function" ? value : null;
    if (this.#connected) this.#render();
  }

  get renderEmpty() {
    return this.#renderEmpty;
  }
  set renderEmpty(value: (() => TableCellContent) | null) {
    this.#renderEmpty = typeof value === "function" ? value : null;
    if (this.#connected) this.#render();
  }

  #render() {
    // A render replaces every header; a sort button that had focus hands it
    // to its successor, so sorting from the keyboard keeps the user's place.
    let focusedKey: string | null = null;
    for (const [key, button] of this.#sortButtons) {
      if (button === document.activeElement) focusedKey = key;
    }
    this.#sortButtons.clear();
    this.textContent = "";
    const table = document.createElement("table");
    table.className = "table";

    const captionText = this.getAttribute("caption");
    if (captionText) {
      const caption = document.createElement("caption");
      caption.className = boolAttr(this, "hide-caption")
        ? "table__caption table__caption--hidden"
        : "table__caption";
      caption.textContent = captionText;
      table.appendChild(caption);
    }

    const head = document.createElement("thead");
    head.className = "table__head";
    const headerRow = document.createElement("tr");
    const selectionColumn = boolAttr(this, "selection-column");
    if (selectionColumn) {
      const selectionHeader = document.createElement("th");
      selectionHeader.className = "table__th table__th--selection";
      selectionHeader.scope = "col";
      if (this.#renderSelectionHeader)
        appendContent(selectionHeader, this.#renderSelectionHeader());
      headerRow.appendChild(selectionHeader);
    }

    for (const column of this.#columns) headerRow.appendChild(this.#headerCell(column));
    head.appendChild(headerRow);
    table.appendChild(head);

    const body = document.createElement("tbody");
    this.#rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      tr.className = "table__row";
      const rowId = this.#getRowId(row, rowIndex);
      tr.dataset.rowId = String(rowId);
      if (selectionColumn && this.#isRowSelected?.(row, rowIndex)) tr.dataset.selected = "";

      if (selectionColumn) {
        const td = document.createElement("td");
        td.className = "table__td table__td--selection";
        if (this.#renderSelectionCell)
          appendContent(td, this.#renderSelectionCell({ row, rowId, rowIndex }));
        tr.appendChild(td);
      }

      for (const column of this.#columns) {
        const td = document.createElement("td");
        td.className = "table__td";
        td.dataset.align = column.align ?? "start";
        const value = this.#getValue(row, column.key);
        const content = this.#renderCell
          ? this.#renderCell({ row, column, value, rowIndex })
          : value == null
            ? ""
            : String(value);
        appendContent(td, content);
        tr.appendChild(td);
      }
      body.appendChild(tr);
    });
    if (this.#rows.length === 0 && (this.#renderEmpty || this.hasAttribute("empty-text"))) {
      const tr = document.createElement("tr");
      tr.className = "table__row";
      const td = document.createElement("td");
      td.className = "table__td table__empty";
      td.colSpan = Math.max(1, this.#columns.length + (selectionColumn ? 1 : 0));
      appendContent(td, this.#renderEmpty ? this.#renderEmpty() : this.getAttribute("empty-text"));
      tr.appendChild(td);
      body.appendChild(tr);
    }
    table.appendChild(body);
    this.appendChild(table);
    if (focusedKey != null) this.#sortButtons.get(focusedKey)?.focus();
  }

  #headerCell(column: TableColumnDef) {
    const th = document.createElement("th");
    th.className = "table__th";
    th.scope = "col";
    th.dataset.align = column.align ?? "start";
    const active = this.sort?.key === column.key ? this.sort.direction : null;
    if (column.sortable) {
      th.setAttribute(
        "aria-sort",
        active === "asc" ? "ascending" : active === "desc" ? "descending" : "none",
      );
      if (active) th.dataset.sortDirection = active;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "table__sort";
      const label = document.createElement("span");
      label.textContent = column.header;
      const glyph = document.createElement("span");
      glyph.className = "table__sort-icon";
      glyph.setAttribute("aria-hidden", "true");
      glyph.innerHTML = sortIcon(active);
      button.append(label, glyph);
      button.addEventListener("click", () => emit(this, "sort-toggle", { key: column.key }));
      this.#sortButtons.set(column.key, button);
      th.appendChild(button);
    } else {
      th.textContent = column.header;
    }
    return th;
  }
}
