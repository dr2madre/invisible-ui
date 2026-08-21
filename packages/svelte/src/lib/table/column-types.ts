/** A table column definition (display + sorting). */
export interface TableColumnDef {
  /** Stable key; the default accessor into a row. */
  key: string;
  /** Header label. */
  header: string;
  /** Whether the column can be sorted. */
  sortable?: boolean;
  /** Whether the column can be hidden via configuration (used by TableSet). */
  hideable?: boolean;
  /** Text alignment for the column's cells/header. Defaults to `start`. */
  align?: "start" | "center" | "end";
}

/** A row is any record; cells read `row[column.key]` by default. */
export type TableRow = Record<string, unknown>;
