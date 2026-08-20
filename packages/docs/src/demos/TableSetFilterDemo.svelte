<script>
  import TableSet from "@design-system/svelte/TableSet.svelte";
  import TextField from "@design-system/svelte/TextField.svelte";

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "city", header: "City", sortable: true },
    { key: "orders", header: "Orders", sortable: true, align: "end" },
  ];
  const allRows = [
    { id: 1, name: "Ada", city: "London", orders: 12 },
    { id: 2, name: "Grace", city: "New York", orders: 8 },
    { id: 3, name: "Alan", city: "Manchester", orders: 21 },
    { id: 4, name: "Katherine", city: "Hampton", orders: 5 },
    { id: 5, name: "Edsger", city: "Rotterdam", orders: 17 },
    { id: 6, name: "Barbara", city: "Boston", orders: 9 },
  ];

  // The application owns the filter: it derives the rows and tells the set
  // whether a filter is active. The set only coordinates page and copy.
  let query = "";
  let selectedRowIds = [];
  $: filtered = allRows.filter((row) =>
    String(row.city).toLowerCase().includes(query.trim().toLowerCase()),
  );
</script>

<TableSet
  {columns}
  rows={filtered}
  title="Customers"
  caption="Customers"
  pageSize={3}
  selectionMode="multiple"
  {selectedRowIds}
  onSelectedRowIdsChange={(ids) => (selectedRowIds = ids)}
  getRowLabel={(row) => row.name}
  filtersActive={query.trim() !== ""}
  totalRowCount={allRows.length}
  filterRevision={query.trim().toLowerCase()}
  onClearFilters={() => (query = "")}
>
  <svelte:fragment slot="toolbar">
    <TextField
      label="Filter by city"
      placeholder="Filter by city"
      value={query}
      onValueChange={(next) => (query = next)}
    />
  </svelte:fragment>
</TableSet>

<p data-testid="filter-readout">Selected: {selectedRowIds.join(", ") || "none"}</p>
