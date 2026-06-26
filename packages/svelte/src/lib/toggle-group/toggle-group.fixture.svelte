<script lang="ts">
  import {
    createToggleGroup,
    type ToggleGroupItem,
    type ToggleGroupType,
  } from "./create-toggle-group";

  export let type: ToggleGroupType = "single";
  export let value: string[] = [];
  export let items: ToggleGroupItem[] = [
    { value: "bold" },
    { value: "italic" },
    { value: "underline" },
  ];

  const { rootAction, itemAction } = createToggleGroup({ items, type, value });
</script>

<div use:rootAction aria-label="Text formatting">
  {#each items as item (item.value)}
    <button use:itemAction={item.value}>{item.value}</button>
  {/each}
</div>
