/**
 * An editable data grid: a table whose cells take keyboard focus one at a
 * time and whose number cells can be edited in place, following the WAI-ARIA
 * Grid pattern (docs/editable-grid-spec.md). The data is the application's;
 * the grid holds the active cell, the mode and the draft.
 */

/** How a body cell behaves. */
export type GridCellKind = "editable" | "summary" | "readonly";

/** What the application's `cell(rowId, columnId)` accessor returns. */
export interface GridCell {
  kind: GridCellKind;
  /** Hours, or any number. `null` is "no value", distinct from 0. */
  value: number | null;
  /** Summary cells: visible and announced text, e.g. "2 entries". */
  badge?: string;
  /** Secondary emphasis: still editable; shown by style and by the visible `secondaryLabel`. */
  secondary?: boolean;
  /** Required when `secondary`; the application's own words, e.g. "Non-working day". */
  secondaryLabel?: string;
  /** The application's validation message, e.g. "More than 24 hours on this day". */
  error?: string;
}

/** Navigation mode moves between cells; editing mode edits one cell. */
export type GridMode = "navigate" | "edit";

/** A cell position, 0-based, with the column header row excluded. */
export interface CellPos {
  row: number;
  column: number;
}

/**
 * The grid as the keyboard sees it. Rows are the body rows and the totals
 * row; columns are the row header, the data columns and the total column, in
 * logical order (inline-start first).
 */
export interface GridShape {
  rowCount: number;
  columnCount: number;
  kindAt(pos: CellPos): GridCellKind;
  hasDetails(pos: CellPos): boolean;
}

/** A key press, with `KeyboardEvent.key` names: "ArrowLeft", "Home", "F2", "5"… */
export interface GridKey {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  /** Whether an input method is composing text. */
  composing: boolean;
}

/** A key combination the application chooses for the details action. */
export type GridShortcut = Omit<GridKey, "composing">;

export interface GridKeyOptions {
  direction: "ltr" | "rtl";
  /** Body rows fully visible in the scroll area, measured by the adapter. */
  pageRows: number;
  /** Whether a typed character starts editing: the locale's digits, separator and sign. */
  accepts(char: string): boolean;
  /** The details shortcut. The grid has no default. */
  detailsShortcut?: GridShortcut;
}

/**
 * What a key does. `none` is a key the grid does not handle: the adapter
 * leaves it to the page (no `preventDefault`), so an enclosing dialog still
 * receives Escape.
 *
 * - `edit`: start editing the active cell. `select` selects the committed
 *   value, `end` puts the caret at its end, `replace` replaces it with
 *   `text`, `clear` starts from an empty draft.
 * - `commit`: commit the draft, then stay on the cell in navigation mode,
 *   edit the next or previous editable cell (`to`), or leave the grid to the
 *   next (`forward`) or previous control. A draft that does not parse never
 *   commits, and the adapter stays in editing mode.
 */
export type GridCommand =
  | { type: "move"; to: CellPos }
  | { type: "edit"; seed: "select" | "end" | "replace" | "clear"; text?: string }
  | { type: "commit"; then: "stay" }
  | { type: "commit"; then: "next" | "previous"; to: CellPos }
  | { type: "commit"; then: "leave"; forward: boolean }
  | { type: "cancel" }
  | { type: "activate" }
  | { type: "details"; commitFirst: boolean }
  | { type: "step"; direction: 1 | -1 }
  | { type: "none" };

/** The active cell as ids, so it survives a change of the data. */
export interface GridCellRef {
  rowId: string;
  columnId: string;
}

/** The row and column ids before or after a change of the data. */
export interface GridIds {
  rowIds: readonly string[];
  columnIds: readonly string[];
}

/** Which label a cell composes. */
export type CellLabelKind = "cell" | "rowHeader" | "columnTotal" | "rowTotal" | "grandTotal";

/**
 * The parts of a cell's spoken label, already turned into text by the
 * adapter: `value` is the value text ("5 hours", or the catalog's "empty").
 */
export interface CellLabelParts {
  /** Defaults to `cell`. */
  kind?: CellLabelKind;
  /** The column label ("Monday 6 October"); not used by `rowHeader`, `rowTotal` and `grandTotal`. */
  column?: string;
  /** The row label ("PX-12 Project X"); not used by `columnTotal` and `grandTotal`. */
  row?: string;
  /** The value text. A `rowHeader` without one is the row label alone (no totals). */
  value?: string;
  badge?: string;
  secondary?: string;
  error?: string;
}
