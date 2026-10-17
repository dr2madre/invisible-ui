<script>
  import DropdownMenu from "@invisible-ui/svelte/DropdownMenu.svelte";
</script>

<DropdownMenu
  label="Actions"
  items={[
    { value: "new", label: "New file" },
    { value: "open", label: "Open" },
    { value: "rename", label: "Rename", disabled: true },
    { value: "delete", label: "Delete" },
  ]}
/>
