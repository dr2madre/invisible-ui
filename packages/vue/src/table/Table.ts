import { defineComponent, h, type PropType } from "vue";
import { Icon } from "../icon/Icon";

export type SortDirection = "asc" | "desc";

/**
 * The active sort: which column and which direction. Structurally identical to
 * the core table primitive's `SortState`; declared here so the published
 * declarations stay self-contained (the core exports it under a namespace,
 * which `.d.ts` emit cannot name).
 */
export interface SortState {
  key: string;
  direction: SortDirection;
}

/** A table column definition (display + sorting). */
export interface TableColumnDef {
  /** Stable key; the default accessor into a row. */
  key: string;
  /** Header label. */
  header: string;
  /** Whether the column can be sorted. */
  sortable?: boolean;
  /** Whether the column can be hidden via configuration. */
  hideable?: boolean;
  /** Text alignment for the column's cells/header. Defaults to `start`. */
  align?: "start" | "center" | "end";
}

/** A row is any record; cells read `row[column.key]` by default. */
export type TableRow = Record<string, unknown>;

/**
 * The default row key: `row.id`, falling back to the index. One shared
 * constant, so selection code can tell the default apart from a consumer's
 * own `getRowId` (selection never accepts the index fallback).
 */
export const defaultGetRowId = (row: TableRow, index: number): string | number =>
  (row.id as string | number) ?? index;

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
   * Render a leading structural column for row selection. The content comes
   * from the `selectionHeader` and `selectionCell` slots; this component stays
   * free of the selection policy itself.
   */
  selectionColumn?: boolean;
  /** Marks a row selected (`data-selected` styling hook). Used with `selectionColumn`. */
  isRowSelected?: (row: TableRow, rowIndex: number) => boolean;
}

/**
 * Table: just the grid: a styled, accessible `<table>` that renders the
 * `columns` and `rows` it is given. It is **controlled**: it does not sort,
 * paginate, or hide columns itself; it reflects the `sort` prop on its headers
 * (`aria-sort`) and calls `onSortToggle(key)` when a sortable header is
 * activated.
 *
 * Cells render `row[column.key]` by default; use the scoped `cell` slot
 * (`{ row, column, value, rowIndex }`) for custom content. Provide a `caption`
 * to name the table for assistive tech. Themed via `--ds-table-*`.
 */
export const Table = defineComponent({
  name: "Table",
  props: {
    columns: { type: Array as PropType<TableColumnDef[]>, required: true },
    rows: { type: Array as PropType<TableRow[]>, required: true },
    sort: { type: Object as PropType<SortState | null>, default: null },
    onSortToggle: { type: Function as PropType<(key: string) => void>, default: undefined },
    caption: { type: String, default: undefined },
    hideCaption: { type: Boolean, default: false },
    getValue: {
      type: Function as PropType<(row: TableRow, key: string) => unknown>,
      default: (row: TableRow, key: string) => row[key],
    },
    getRowId: {
      type: Function as PropType<(row: TableRow, index: number) => string | number>,
      default: defaultGetRowId,
    },
    selectionColumn: { type: Boolean, default: false },
    isRowSelected: {
      type: Function as PropType<(row: TableRow, rowIndex: number) => boolean>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const ariaSort = (key: string): "ascending" | "descending" | "none" =>
      props.sort?.key === key
        ? props.sort.direction === "asc"
          ? "ascending"
          : "descending"
        : "none";

    const sortGlyph = (key: string) => {
      if (props.sort?.key === key && props.sort.direction === "asc") {
        return h(
          Icon,
          { size: "0.9em" },
          { default: () => h("polyline", { points: "6 14 12 8 18 14" }) },
        );
      }
      if (props.sort?.key === key) {
        return h(
          Icon,
          { size: "0.9em" },
          { default: () => h("polyline", { points: "6 10 12 16 18 10" }) },
        );
      }
      return h(
        Icon,
        { size: "0.9em", class: "table__sort-icon-unset" },
        {
          default: () => [
            h("polyline", { points: "8 9 12 5 16 9" }),
            h("polyline", { points: "8 15 12 19 16 15" }),
          ],
        },
      );
    };

    return () =>
      h("table", { class: "table" }, [
        props.caption
          ? h(
              "caption",
              {
                class: props.hideCaption
                  ? "table__caption table__caption--hidden"
                  : "table__caption",
              },
              props.caption,
            )
          : null,
        h("thead", { class: "table__head" }, [
          h("tr", [
            props.selectionColumn
              ? h(
                  "th",
                  { class: "table__th table__th--selection", scope: "col" },
                  slots.selectionHeader ? slots.selectionHeader() : undefined,
                )
              : null,
            ...props.columns.map((column) =>
              h(
                "th",
                {
                  key: column.key,
                  class: "table__th",
                  scope: "col",
                  "data-align": column.align ?? "start",
                  "data-sort-direction":
                    column.sortable && props.sort?.key === column.key
                      ? props.sort.direction
                      : undefined,
                  "aria-sort": column.sortable ? ariaSort(column.key) : undefined,
                },
                column.sortable
                  ? [
                      h(
                        "button",
                        {
                          type: "button",
                          class: "table__sort",
                          onClick: () => props.onSortToggle?.(column.key),
                        },
                        [
                          h("span", column.header),
                          h("span", { class: "table__sort-icon", "aria-hidden": "true" }, [
                            sortGlyph(column.key),
                          ]),
                        ],
                      ),
                    ]
                  : column.header,
              ),
            ),
          ]),
        ]),
        h(
          "tbody",
          props.rows.map((row, rowIndex) => {
            const rowId = props.getRowId(row, rowIndex);
            return h(
              "tr",
              {
                key: rowId,
                class: "table__row",
                "data-selected":
                  props.selectionColumn && props.isRowSelected?.(row, rowIndex) ? "" : undefined,
              },
              [
                props.selectionColumn
                  ? h(
                      "td",
                      { class: "table__td table__td--selection" },
                      slots.selectionCell
                        ? slots.selectionCell({ row, rowId, rowIndex })
                        : undefined,
                    )
                  : null,
                ...props.columns.map((column) => {
                  const value = props.getValue(row, column.key);
                  return h(
                    "td",
                    { key: column.key, class: "table__td", "data-align": column.align ?? "start" },
                    slots.cell ? slots.cell({ row, column, value, rowIndex }) : String(value ?? ""),
                  );
                }),
              ],
            );
          }),
        ),
      ]);
  },
});
