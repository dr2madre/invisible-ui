<script>
  import Table from "@design-system/svelte/Table.svelte";

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "role", header: "Role" },
    { key: "commits", header: "Commits", sortable: true, align: "end" },
  ];
  const rows = [
    { id: 1, name: "Ada", role: "Lead", commits: 128 },
    { id: 2, name: "Grace", role: "Engineer", commits: 95 },
    { id: 3, name: "Alan", role: "Engineer", commits: 142 },
  ];
</script>

<Table {columns} {rows} caption="Contributors" />
