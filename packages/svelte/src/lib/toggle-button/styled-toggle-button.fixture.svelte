<script lang="ts">
  import ToggleButton from "./ToggleButton.svelte";

  export let pressed = false;
  export let disabled = false;
  export let onPressedChange: ((p: boolean) => void) | undefined = undefined;
</script>

<ToggleButton {pressed} {disabled} {onPressedChange} label="Bold">B</ToggleButton>
