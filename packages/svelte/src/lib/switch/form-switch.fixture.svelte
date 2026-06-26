<script lang="ts">
  import Switch from "./Switch.svelte";

  export let checked = false;
  export let name = "wifi";
  export let value = "on";
</script>

<form data-testid="form">
  <Switch label="Wi-Fi" {name} {value} {checked} />
</form>
