<script lang="ts">
  import { createTabs, type ActivationMode, type TabItem } from "./create-tabs";

  export let value = "one";
  export let activationMode: ActivationMode = "automatic";
  export let items: TabItem[] = [{ value: "one" }, { value: "two" }, { value: "three" }];

  const { rootAction, tabAction, panelAction } = createTabs({
    id: "t",
    items,
    value,
    activationMode,
  });
</script>

<div use:rootAction aria-label="Sections">
  {#each items as item (item.value)}
    <button use:tabAction={item.value}>{item.value}</button>
  {/each}
</div>

{#each items as item (item.value)}
  <div use:panelAction={item.value}>Panel {item.value}</div>
{/each}
