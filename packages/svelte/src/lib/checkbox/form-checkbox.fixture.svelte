<script lang="ts">
  import Checkbox from "./Checkbox.svelte";

  export let checked = false;
  export let name = "subscribe";
  export let value = "yes";
</script>

<form data-testid="form">
  <Checkbox label="Subscribe" {name} {value} {checked} />
</form>
