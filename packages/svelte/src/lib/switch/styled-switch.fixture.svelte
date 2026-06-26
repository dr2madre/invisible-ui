<script lang="ts">
  import Switch from "./Switch.svelte";

  export let checked = false;
  export let disabled = false;
  export let onCheckedChange: ((c: boolean) => void) | undefined = undefined;
</script>

<Switch {checked} {disabled} {onCheckedChange} label="Wi-Fi" />
