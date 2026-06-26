<script lang="ts">
  import ContextMenu from "./ContextMenu.svelte";
  import type { MenuItem } from "./create-context-menu";

  export let disabled = false;
  export let onSelect: ((value: string) => void) | undefined = undefined;
  export let items: MenuItem[] = [
    { value: "back", label: "Back" },
    { value: "reload", label: "Reload" },
    { value: "save", label: "Save as…", disabled: true },
    { value: "inspect", label: "Inspect" },
  ];
</script>

<button type="button">before</button>
<ContextMenu {items} {disabled} {onSelect} label="Page actions">
  <div>Right-click here</div>
</ContextMenu>
<button type="button">after</button>
