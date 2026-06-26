<script lang="ts">
  import TextField from "./TextField.svelte";

  export let value = "";
  export let name = "email";
</script>

<form data-testid="form">
  <TextField label="Email" {name} {value} />
</form>
