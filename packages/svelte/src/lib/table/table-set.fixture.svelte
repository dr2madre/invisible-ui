<script lang="ts">
  import TableSet from "./TableSet.svelte";
  import type { TableColumnDef, TableRow } from "./Table.svelte";

  import type { SortState } from "./create-table";

  export let pageSize: number | undefined = undefined;
  export let page = 1;
  export let view: "table" | "card" = "table";
  export let allowViewToggle = false;
  export let configurable = false;
  export let infinite = false;
  export let hasMore = false;
  export let loading = false;
  export let onLoadMore: (() => void) | undefined = undefined;
  export let sort: SortState | null = null;
  export let hiddenColumns: string[] = [];
  export let onPageChange: ((page: number) => void) | undefined = undefined;
  export let onSortChange: ((sort: SortState | null) => void) | undefined = undefined;
  export let onHiddenColumnsChange: ((hidden: string[]) => void) | undefined = undefined;

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
</script>

<TableSet
  {columns}
  {rows}
  {pageSize}
  {page}
  {sort}
  {hiddenColumns}
  {onPageChange}
  {onSortChange}
  {onHiddenColumnsChange}
  {view}
  {allowViewToggle}
  {configurable}
  {infinite}
  {hasMore}
  {loading}
  {onLoadMore}
  title="People"
  caption="People"
/>
