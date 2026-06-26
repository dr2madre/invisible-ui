<script>
  import TableSet from "@design-system/svelte/TableSet.svelte";

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "city", header: "City", sortable: true },
    { key: "orders", header: "Orders", sortable: true, align: "end" },
  ];
  const rows = [
    { id: 1, name: "Ada", city: "London", orders: 12 },
    { id: 2, name: "Grace", city: "New York", orders: 8 },
    { id: 3, name: "Alan", city: "Manchester", orders: 21 },
    { id: 4, name: "Katherine", city: "Hampton", orders: 5 },
    { id: 5, name: "Edsger", city: "Rotterdam", orders: 17 },
  ];
</script>

<TableSet
  {columns}
  {rows}
  title="Customers"
  caption="Customers"
  configurable
  allowViewToggle
  cardTitleKey="name"
  cardDescriptionKey="city"
  pageSize={3}
/>
