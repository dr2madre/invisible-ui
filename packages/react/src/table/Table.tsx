import type { ReactNode } from "react";
import { Icon } from "../icon/Icon";
import type { SortState } from "./use-table";

/** A table column definition (display and sorting). */
export interface TableColumnDef {
  /** Stable key; the default accessor into a row. */
  key: string;
  /** Header label. */
  header: string;
  /** Whether the column can be sorted. */
  sortable?: boolean;
  /** Whether the column can be hidden via configuration (used by TableSet). */
  hideable?: boolean;
  /** Text alignment for the column's cells and header. Defaults to `start`. */
  align?: "start" | "center" | "end";
}

/** A row is any record; cells read `row[column.key]` by default. */
export type TableRow = Record<string, unknown>;

/** What a custom cell renderer receives. */
export interface TableCellContext {
  row: TableRow;
  column: TableColumnDef;
  value: unknown;
  rowIndex: number;
}

/** What a selection cell renderer receives. */
export interface TableSelectionCellContext {
  row: TableRow;
  rowId: string | number;
  rowIndex: number;
}

/**
 * The default row key: `row.id`, falling back to the index. One shared
 * constant, so selection code can tell the default apart from a consumer's
 * own `getRowId` (selection never accepts the index fallback).
 */
export const defaultGetRowId = (row: TableRow, index: number): string | number =>
  (row.id as string | number) ?? index;

/** The default cell accessor: `row[key]`. */
export const defaultGetValue = (row: TableRow, key: string): unknown => row[key];

/** A cell value as text: consumer data never renders as markup. */
export const cellText = (value: unknown): string => String(value ?? "");

export interface TableProps {
  columns: TableColumnDef[];
  rows: TableRow[];
  /** The active sort, reflected on the headers (controlled). */
  sort?: SortState | null;
  /** Called with the column key when a sortable header is activated. */
  onSortToggle?: (key: string) => void;
  /** Accessible name for the table (rendered as a `<caption>`). */
  caption?: string;
  /** Visually hide the caption (still available to assistive tech). */
  hideCaption?: boolean;
  /** Reads a row's value for a column (defaults to `row[key]`). */
  getValue?: (row: TableRow, key: string) => unknown;
  /** Stable row key (defaults to `row.id`, falling back to the index). */
  getRowId?: (row: TableRow, index: number) => string | number;
  /**
   * Render a leading structural column for row selection. Its content comes
   * from `selectionHeader` and `renderSelectionCell`; this component stays
   * free of the selection policy itself.
   */
  selectionColumn?: boolean;
  /** Marks a row selected (`data-selected` styling hook). Used with `selectionColumn`. */
  isRowSelected?: (row: TableRow, rowIndex: number) => boolean;
  /** Custom cell content. Defaults to the cell value, as text. */
  renderCell?: (context: TableCellContext) => ReactNode;
  /** Header cell content of the selection column. */
  selectionHeader?: ReactNode;
  /** Body cell content of the selection column, rendered for every row. */
  renderSelectionCell?: (context: TableSelectionCellContext) => ReactNode;
}

const ariaSort = (sort: SortState | null, key: string): "ascending" | "descending" | "none" =>
  sort?.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none";

function SortGlyph({ direction }: { direction: SortState["direction"] | undefined }) {
  if (direction === "asc") {
    return (
      <Icon size="0.9em">
        <polyline points="6 14 12 8 18 14" />
      </Icon>
    );
  }
  if (direction === "desc") {
    return (
      <Icon size="0.9em">
        <polyline points="6 10 12 16 18 10" />
      </Icon>
    );
  }
  return (
    <Icon size="0.9em" className="table__sort-icon-unset">
      <polyline points="8 9 12 5 16 9" />
      <polyline points="8 15 12 19 16 15" />
    </Icon>
  );
}

/**
 * Table: just the grid, a styled, accessible `<table>` that renders the
 * `columns` and `rows` it is given. It is **controlled**: it does not sort,
 * paginate or hide columns itself; it reflects the `sort` prop on its headers
 * (`aria-sort`) and calls `onSortToggle(key)` when a sortable header is
 * activated. Compose it inside `TableSet` for the header, configuration and
 * pagination, or pass already-prepared `columns` and `rows` directly.
 *
 * Cells render `row[column.key]` as text by default; `renderCell` renders
 * custom content. Provide a `caption` to name the table for assistive tech.
 * Themed via `--ds-table-*`.
 */
export function Table({
  columns,
  rows,
  sort = null,
  onSortToggle,
  caption,
  hideCaption = false,
  getValue = defaultGetValue,
  getRowId = defaultGetRowId,
  selectionColumn = false,
  isRowSelected,
  renderCell,
  selectionHeader,
  renderSelectionCell,
}: TableProps) {
  return (
    <table className="table">
      {caption ? (
        <caption
          className={hideCaption ? "table__caption table__caption--hidden" : "table__caption"}
        >
          {caption}
        </caption>
      ) : null}
      <thead className="table__head">
        <tr>
          {selectionColumn ? (
            <th className="table__th table__th--selection" scope="col">
              {selectionHeader}
            </th>
          ) : null}
          {columns.map((column) => {
            const direction = sort?.key === column.key ? sort.direction : undefined;
            return (
              <th
                key={column.key}
                className="table__th"
                scope="col"
                data-align={column.align ?? "start"}
                data-sort-direction={column.sortable ? direction : undefined}
                aria-sort={column.sortable ? ariaSort(sort, column.key) : undefined}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className="table__sort"
                    onClick={() => onSortToggle?.(column.key)}
                  >
                    <span>{column.header}</span>
                    <span className="table__sort-icon" aria-hidden="true">
                      <SortGlyph direction={direction} />
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => {
          const rowId = getRowId(row, rowIndex);
          return (
            <tr
              key={rowId}
              className="table__row"
              data-selected={selectionColumn && isRowSelected?.(row, rowIndex) ? "" : undefined}
            >
              {selectionColumn ? (
                <td className="table__td table__td--selection">
                  {renderSelectionCell?.({ row, rowId, rowIndex })}
                </td>
              ) : null}
              {columns.map((column) => {
                const value = getValue(row, column.key);
                return (
                  <td key={column.key} className="table__td" data-align={column.align ?? "start"}>
                    {renderCell ? renderCell({ row, column, value, rowIndex }) : cellText(value)}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
