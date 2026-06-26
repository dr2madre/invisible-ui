<script lang="ts">
  import TableSet from "./TableSet.svelte";
  import type { TableColumnDef, TableRow } from "./Table.svelte";

  export let pageSize: number | undefined = undefined;
  export let view: "table" | "card" = "table";
  export let allowViewToggle = false;
  export let configurable = false;
  export let infinite = false;
  export let hasMore = false;
  export let loading = false;
  export let onLoadMore: (() => void) | undefined = undefined;

  const columns: TableColumnDef[] = [
    { key: "name", header: "Name", sortable: true, hideable: false },
    { key: "age", header: "Age", sortable: true, align: "end" },
    { key: "city", header: "City" },
  ];

  const rows: TableRow[] = [
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
