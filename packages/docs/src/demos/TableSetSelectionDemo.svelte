<script>
  import Button from "@design-system/svelte/Button.svelte";
  import TableSet from "@design-system/svelte/TableSet.svelte";

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
  ];

  // Emptying the rows shows two contract points: the select-all control
  // disables over an empty scope, and the selection itself is retained.
  let loaded = true;
  let selectedRowIds = [2];
  $: rows = loaded ? allRows : [];
</script>

<Button variant="secondary" onpress={() => (loaded = !loaded)}>
  {loaded ? "Clear rows" : "Load rows"}
</Button>

<TableSet
  {columns}
  {rows}
  title="Customers"
  caption="Customers"
  allowViewToggle
  cardTitleKey="name"
  cardDescriptionKey="city"
  pageSize={3}
  selectionMode="multiple"
  {selectedRowIds}
  onSelectedRowIdsChange={(ids) => (selectedRowIds = ids)}
  getRowLabel={(row) => row.name}
/>

<p data-testid="selection-readout">Selected: {selectedRowIds.join(", ") || "none"}</p>
