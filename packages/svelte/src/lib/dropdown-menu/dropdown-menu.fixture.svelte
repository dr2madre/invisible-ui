<script lang="ts">
  import DropdownMenu from "./DropdownMenu.svelte";
  import type { MenuEntry } from "./create-dropdown-menu";

  interface Props {
    disabled?: boolean;
    onSelect?: (value: string) => void;
    items?: MenuEntry[];
  }

  let {
    disabled = false,
    onSelect,
    items = [
      { value: "new", label: "New file" },
      { value: "open", label: "Open" },
      { value: "rename", label: "Rename", disabled: true },
      { value: "delete", label: "Delete" },
    ],
  }: Props = $props();
</script>

<DropdownMenu label="Actions" {items} {disabled} {onSelect} />
