export type SortDirection = "asc" | "desc";

/** A row's stable identity. */
export type RowId = string | number;

/** How rows can be selected. */
export type SelectionMode = "none" | "single" | "multiple";

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
  /** How rows can be selected. */
  selectionMode: SelectionMode;
  /** Ids of the selected rows, in the order they were selected. */
  selectedRowIds: RowId[];
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
  /** How rows can be selected. Defaults to `"none"`. */
  selectionMode?: SelectionMode;
  /** Initially selected row ids. Defaults to none. */
  selectedRowIds?: RowId[];
  /** Called whenever the selected row ids change. */
  onSelectedRowIdsChange?: (ids: RowId[]) => void;
}
