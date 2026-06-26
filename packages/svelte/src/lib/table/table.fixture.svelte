<script lang="ts">
  import Table, { type TableColumnDef, type TableRow, type SortState } from "./Table.svelte";

  export let sort: SortState | null = null;
  export let onSortToggle: ((key: string) => void) | undefined = undefined;

  const columns: TableColumnDef[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "age", header: "Age", sortable: true, align: "end" },
    { key: "city", header: "City" },
  ];

  const rows: TableRow[] = [
    { id: 1, name: "Ada", age: 36, city: "London" },
    { id: 2, name: "Grace", age: 85, city: "New York" },
    { id: 3, name: "alan", age: 41, city: "London" },
  ];
</script>

<Table {columns} {rows} {sort} {onSortToggle} caption="People" />
