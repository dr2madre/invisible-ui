<script lang="ts">
  import Button from "../button/Button.svelte";
  import Tabs, { type TabsItem } from "./Tabs.svelte";

  let views: TabsItem[] = $state.raw([
    { value: "list", label: "List", content: "List view." },
    { value: "grid", label: "Grid", content: "Grid view." },
  ]);
  let view = $state("list");

  function addView() {
    const number = views.length + 1;
    const value = `view-${number}`;
    views = [...views, { value, label: `View ${number}`, content: `View ${number}.` }];
    view = value;
  }
</script>

<Tabs label="Views" bind:value={view} items={views}>
  {#snippet actions()}
    <Button iconOnly ariaLabel="Add view" onpress={addView}>+</Button>
  {/snippet}
</Tabs>
