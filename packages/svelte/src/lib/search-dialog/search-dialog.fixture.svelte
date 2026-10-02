<script lang="ts">
  import SearchDialog from "./SearchDialog.svelte";
  import type { SearchDialogItem } from "./create-search-dialog";

  interface Props {
    open?: boolean;
    onSelect?: (value: string) => void;
    onOpenChange?: (o: boolean) => void;
    suggestions?: SearchDialogItem[];
    loading?: boolean;
    items?: SearchDialogItem[];
  }

  let {
    open = false,
    onSelect,
    onOpenChange,
    suggestions = [],
    loading = false,
    items = [
      { value: "new-file", label: "New File" },
      { value: "open", label: "Open…" },
      { value: "save", label: "Save" },
      { value: "settings", label: "Settings" },
    ],
  }: Props = $props();
</script>

<SearchDialog {items} {open} {onSelect} {onOpenChange} {suggestions} {loading}>
  {#snippet trigger()}<span>Open palette</span>{/snippet}
</SearchDialog>
