<script lang="ts">
  import ToggleGroup from "./ToggleGroup.svelte";
  import ToggleButton from "../toggle-button/ToggleButton.svelte";
  import Toolbar from "../toolbar/Toolbar.svelte";

  interface Props {
    items?: string[];
    disabled?: string[];
    orientation?: "horizontal" | "vertical";
    inToolbar?: boolean;
  }

  let {
    items = ["List", "Board", "Calendar"],
    disabled = [],
    orientation = "horizontal",
    inToolbar = false,
  }: Props = $props();
</script>

{#snippet group()}
  <ToggleGroup label="View" {orientation}>
    {#each items as item (item)}
      <ToggleButton label={item} disabled={disabled.includes(item)}>{item}</ToggleButton>
    {/each}
  </ToggleGroup>
{/snippet}

<button type="button">Before</button>
{#if inToolbar}
  <Toolbar label="Editor">
    <button type="button">Undo</button>
    {@render group()}
  </Toolbar>
{:else}
  {@render group()}
{/if}
<button type="button">After</button>
