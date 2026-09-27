<script lang="ts">
  import ContextMenu from "./ContextMenu.svelte";
  import type { MenuItem } from "./create-context-menu";

  interface Props {
    disabled?: boolean;
    onSelect?: (value: string) => void;
    items?: MenuItem[];
  }

  let {
    disabled = false,
    onSelect,
    items = [
      { value: "back", label: "Back" },
      { value: "reload", label: "Reload" },
      { value: "save", label: "Save as…", disabled: true },
      { value: "inspect", label: "Inspect" },
    ],
  }: Props = $props();
</script>

<button type="button">before</button>
<ContextMenu {items} {disabled} {onSelect} label="Page actions">
  <div>Right-click here</div>
</ContextMenu>
<button type="button">after</button>
