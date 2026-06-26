<script lang="ts">
  import DropdownMenu from "./DropdownMenu.svelte";
  import type { MenuItem } from "./create-dropdown-menu";

  export let disabled = false;
  export let onSelect: ((value: string) => void) | undefined = undefined;
  export let items: MenuItem[] = [
    { value: "new", label: "New file" },
    { value: "open", label: "Open" },
    { value: "rename", label: "Rename", disabled: true },
    { value: "delete", label: "Delete" },
  ];
</script>

<DropdownMenu label="Actions" {items} {disabled} {onSelect} />
