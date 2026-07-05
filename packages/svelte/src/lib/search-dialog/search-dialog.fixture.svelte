<script lang="ts">
  import SearchDialog from "./SearchDialog.svelte";
  import type { SearchDialogItem } from "./create-search-dialog";

  export let open = false;
  export let onSelect: ((value: string) => void) | undefined = undefined;
  export let onOpenChange: ((o: boolean) => void) | undefined = undefined;

  export let items: SearchDialogItem[] = [
    { value: "new-file", label: "New File" },
    { value: "open", label: "Open…" },
    { value: "save", label: "Save" },
    { value: "settings", label: "Settings" },
  ];
</script>

<SearchDialog {items} {open} {onSelect} {onOpenChange}>
  <span slot="trigger">Open palette</span>
</SearchDialog>
