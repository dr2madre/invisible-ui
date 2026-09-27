<script lang="ts">
  import TableSet, { type TableViewDef } from "./TableSet.svelte";
  import type { TableColumnDef, TableRow } from "./Table.svelte";
  import type { RowId, SelectionMode } from "./create-table";

  interface Props {
    selectionMode?: SelectionMode;
    selectedRowIds?: RowId[];
    onSelectedRowIdsChange?: (ids: RowId[]) => void;
    /** Feeds the callback value back into the prop, like a controlled consumer. */
    bindSelection?: boolean;
    isRowSelectable?: (row: TableRow) => boolean;
    getRowLabel?: (row: TableRow) => string;
    getRowId?: (row: TableRow, index: number) => string | number;
    pageSize?: number;
    page?: number;
    view?: "table" | "card";
    views?: TableViewDef[];
    filtersActive?: boolean;
    loading?: boolean;
    totalRowCount?: number;
    filterRevision?: string | number;
    onClearFilters?: () => void;
    noResultsLabel?: string;
    onPageChange?: (page: number) => void;
    columns?: TableColumnDef[];
    rows?: TableRow[];
  }

  let {
    selectionMode = "multiple",
    selectedRowIds = $bindable([]),
    onSelectedRowIdsChange,
    bindSelection = false,
    isRowSelectable = () => true,
    getRowLabel = (row) => String(row.name),
    getRowId,
    pageSize,
    page = 1,
    view = "table",
    views,
    filtersActive = false,
    loading = false,
    totalRowCount,
    filterRevision,
    onClearFilters,
    noResultsLabel,
    onPageChange,
    columns = [
      { key: "name", header: "Name", sortable: true, hideable: false },
      { key: "age", header: "Age", sortable: true, align: "end" },
      { key: "city", header: "City" },
    ],
    rows = [
      { id: 1, name: "Ada", age: 36, city: "London" },
      { id: 2, name: "Grace", age: 85, city: "New York" },
      { id: 3, name: "alan", age: 41, city: "London" },
      { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
      { id: 5, name: "Barbara", age: 80, city: "Boston" },
    ],
  }: Props = $props();

  const handleChange = (ids: RowId[]) => {
    if (bindSelection) selectedRowIds = ids;
    onSelectedRowIdsChange?.(ids);
  };
</script>

<TableSet
  {columns}
  {rows}
  {views}
  {pageSize}
  {page}
  {view}
  {selectionMode}
  {selectedRowIds}
  {isRowSelectable}
  {getRowLabel}
  {getRowId}
  {filtersActive}
  {totalRowCount}
  {filterRevision}
  {onClearFilters}
  {noResultsLabel}
  {onPageChange}
  onSelectedRowIdsChange={bindSelection ? handleChange : onSelectedRowIdsChange}
  title="People"
  caption="People"
  {loading}
/>
