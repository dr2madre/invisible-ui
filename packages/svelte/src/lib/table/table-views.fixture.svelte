<script lang="ts">
  import TableSet, { type TableViewDef } from "./TableSet.svelte";
  import type { TableColumnDef } from "./Table.svelte";

  const peopleColumns: TableColumnDef[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "city", header: "City" },
  ];
  const orderColumns: TableColumnDef[] = [
    { key: "ref", header: "Reference", sortable: true },
    { key: "total", header: "Total", sortable: true, align: "end" },
  ];

  interface Props {
    activeView?: string;
    onViewChange?: (id: string) => void;
    views?: TableViewDef[];
  }

  let {
    activeView,
    onViewChange,
    views = [
      {
        id: "people",
        label: "People",
        columns: peopleColumns,
        rows: [
          { id: 1, name: "Ada", city: "London" },
          { id: 2, name: "Grace", city: "New York" },
        ],
      },
      {
        id: "orders",
        label: "Orders",
        columns: orderColumns,
        rows: [
          { id: "A1", ref: "A1", total: 120 },
          { id: "A2", ref: "A2", total: 80 },
        ],
      },
    ],
  }: Props = $props();
</script>

<TableSet {views} {activeView} {onViewChange} title="Workspace" viewsLabel="Data views" />
