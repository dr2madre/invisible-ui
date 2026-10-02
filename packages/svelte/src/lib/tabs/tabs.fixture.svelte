<script lang="ts">
  import { untrack } from "svelte";
  import { createTabs, type ActivationMode, type TabItem } from "./create-tabs";

  interface Props {
    value?: string;
    activationMode?: ActivationMode;
    items?: TabItem[];
  }

  let {
    value = "one",
    activationMode = "automatic",
    items = [{ value: "one" }, { value: "two" }, { value: "three" }],
  }: Props = $props();

  // Seeded once from the first props.
  const { rootAction, tabAction, panelAction } = untrack(() =>
    createTabs({
      id: "t",
      items,
      value,
      activationMode,
    }),
  );
</script>

<div use:rootAction aria-label="Sections">
  {#each items as item (item.value)}
    <button use:tabAction={item.value}>{item.value}</button>
  {/each}
</div>

{#each items as item (item.value)}
  <div use:panelAction={item.value}>Panel {item.value}</div>
{/each}
