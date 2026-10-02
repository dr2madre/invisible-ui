<script lang="ts">
  import ToggleGroup from "./ToggleGroup.svelte";
  import ToggleButton from "../toggle-button/ToggleButton.svelte";

  interface Props {
    label?: string;
    variant?: "separate" | "segmented";
  }

  let { label, variant = "separate" }: Props = $props();
</script>

<ToggleGroup {label} {variant}>
  <ToggleButton label="List">List</ToggleButton>
  <ToggleButton label="Board">Board</ToggleButton>
  <ToggleButton label="Calendar">Calendar</ToggleButton>
</ToggleGroup>
