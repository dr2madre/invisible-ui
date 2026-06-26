export type SortDirection = "asc" | "desc";

/** The active sort: which column and which direction. */
export interface SortState {
  key: string;
  direction: SortDirection;
}

/** A column, as the headless core needs to know it (sorting + visibility). */
export interface TableColumn {
  /** Stable key; also the default accessor into a row. */
  key: string;
  /** Whether the column can be sorted. Defaults to `false`. */
  sortable?: boolean;
  /** Whether the column can be hidden via configuration. Defaults to `true`. */
  hideable?: boolean;
}

/** Internal, fully-resolved state of a table. */
export interface TableState {
  columns: TableColumn[];
  /** The active sort, or `null` when unsorted. */
  sort: SortState | null;
  /** Keys of columns hidden via configuration. */
  hiddenColumns: string[];
  /** Base id (styling/labelling hook). */
  id: string;
}

/** User-provided options when creating a table. */
export interface TableContext {
  columns: TableColumn[];
  /** Initial sort. Defaults to none. */
  sort?: SortState | null;
  /** Initially hidden column keys. Defaults to none. */
  hiddenColumns?: string[];
  /** Base id. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the sort changes (including cleared to `null`). */
  onSortChange?: (sort: SortState | null) => void;
  /** Called whenever the hidden-column set changes. */
  onHiddenColumnsChange?: (hidden: string[]) => void;
}
