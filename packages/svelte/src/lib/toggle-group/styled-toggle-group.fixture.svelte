<script lang="ts">
  import ToggleGroup from "./ToggleGroup.svelte";
  import ToggleButton from "../toggle-button/ToggleButton.svelte";

  export let label: string | undefined = undefined;
  export let variant: "separate" | "segmented" = "separate";
</script>

<ToggleGroup {label} {variant}>
  <ToggleButton label="List">List</ToggleButton>
  <ToggleButton label="Board">Board</ToggleButton>
  <ToggleButton label="Calendar">Calendar</ToggleButton>
</ToggleGroup>
