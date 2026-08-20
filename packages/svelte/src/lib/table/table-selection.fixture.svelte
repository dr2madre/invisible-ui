<script lang="ts">
  import TableSet, { type TableViewDef } from "./TableSet.svelte";
  import type { TableColumnDef, TableRow } from "./Table.svelte";
  import type { RowId, SelectionMode } from "./create-table";

  export let selectionMode: SelectionMode = "multiple";
  export let selectedRowIds: RowId[] = [];
  export let onSelectedRowIdsChange: ((ids: RowId[]) => void) | undefined = undefined;
  // Feeds the callback value back into the prop, like a controlled consumer.
  export let bindSelection = false;
  export let isRowSelectable: (row: TableRow) => boolean = () => true;
  export let getRowLabel: ((row: TableRow) => string) | undefined = (row) => String(row.name);
  export let getRowId: ((row: TableRow, index: number) => string | number) | undefined = undefined;
  export let pageSize: number | undefined = undefined;
  export let page = 1;
  export let view: "table" | "card" = "table";
  export let views: TableViewDef[] | undefined = undefined;
  export let filtersActive = false;
  export let totalRowCount: number | undefined = undefined;
  export let filterRevision: string | number | undefined = undefined;
  export let onClearFilters: (() => void) | undefined = undefined;
  export let noResultsLabel: string | undefined = undefined;
  export let onPageChange: ((page: number) => void) | undefined = undefined;

  export let columns: TableColumnDef[] = [
    { key: "name", header: "Name", sortable: true, hideable: false },
    { key: "age", header: "Age", sortable: true, align: "end" },
    { key: "city", header: "City" },
  ];

  export let rows: TableRow[] = [
    { id: 1, name: "Ada", age: 36, city: "London" },
    { id: 2, name: "Grace", age: 85, city: "New York" },
    { id: 3, name: "alan", age: 41, city: "London" },
    { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
    { id: 5, name: "Barbara", age: 80, city: "Boston" },
  ];

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
/>
